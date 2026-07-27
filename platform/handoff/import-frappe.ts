/**
 * import-frappe.ts — read-only Frappe LMS -> cseLMS extractor + normalizer.
 *
 * Pulls every course out of the live Frappe LMS via its auto-REST API (token
 * auth), parses the EditorJS lesson content correctly, resolves quizzes that are
 * referenced *inside* the blocks, downloads image/PDF attachments (videos stay on
 * Bunny/YouTube), and writes a normalized JSON bundle + a dry-run report.
 *
 * The EXTRACT + NORMALIZE half is fully working and Frappe-accurate. The LOAD
 * half (writing into Supabase) is a single clearly-marked function at the bottom
 * you wire to your actual tables/columns — run --dry-run until the report looks
 * right, then drop the guard.
 *
 * Run (Node 18+; `npx tsx` or compile):
 *   FRAPPE_URL=https://demo.combatsportseducation.com \
 *   FRAPPE_KEY=<api_key> FRAPPE_SECRET=<api_secret> \
 *   OUT_DIR=./frappe-export \
 *   npx tsx scripts/import-frappe.ts --dry-run
 *
 * Then, to actually load a school:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... SCHOOL_ID=<uuid> \
 *   FRAPPE_URL=... FRAPPE_KEY=... FRAPPE_SECRET=... \
 *   npx tsx scripts/import-frappe.ts --load --school <uuid>
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// ---------------------------------------------------------------- config --
const FRAPPE_URL = must("FRAPPE_URL").replace(/\/$/, "");
const TOKEN = `token ${must("FRAPPE_KEY")}:${must("FRAPPE_SECRET")}`;
const OUT_DIR = process.env.OUT_DIR || "./frappe-export";
const ASSETS_DIR = join(OUT_DIR, "assets");
const DRY_RUN = process.argv.includes("--dry-run") || !process.argv.includes("--load");
const SCHOOL_ID = argValue("--school") || process.env.SCHOOL_ID || "";

function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}
function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

// ---------------------------------------------------------- normalized types --
type NormOption = { text: string; correct: boolean };
type NormQuestion = { source: string; text: string; type: string; options: NormOption[]; explanation: string };
type NormQuiz = { source: string; title: string; questions: NormQuestion[] };
type NormBlock =
  | { kind: "richtext"; html: string }
  | { kind: "image"; asset: string; caption?: string } // asset = local file under assets/
  | { kind: "video"; provider: "bunny" | "youtube" | "url"; url: string }
  | { kind: "quiz"; quiz: string }; // quiz = NormQuiz.source
type NormLesson = { source: string; title: string; blocks: NormBlock[]; quizzes: string[] };
type NormSection = { source: string; title: string; lessons: NormLesson[] };
type NormCourse = {
  source: string;
  title: string;
  description: string;
  cover?: string; // local asset
  sections: NormSection[];
};
type NormEnrollment = { email: string; course: string; completedLessons: string[]; completed: boolean };
type NormUser = { email: string; firstName: string; lastName: string };
type Bundle = {
  site: string;
  courses: NormCourse[];
  quizzes: Record<string, NormQuiz>;
  users: NormUser[];
  enrollments: NormEnrollment[];
};

// ------------------------------------------------------------------- api --
async function api(path: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${FRAPPE_URL}/api/resource/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { Authorization: TOKEN, Accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${url.pathname} -> ${res.status} ${res.statusText}`);
  return (await res.json()).data;
}
const getDoc = (doctype: string, name: string) => api(`${doctype}/${encodeURIComponent(name)}`);
async function listNames(doctype: string, filters?: string): Promise<string[]> {
  const p: Record<string, string> = { limit_page_length: "0", fields: '["name"]' };
  if (filters) p.filters = filters;
  return (await api(doctype, p)).map((r: any) => r.name);
}
async function listRows(doctype: string, fields: string[]): Promise<any[]> {
  return api(doctype, { limit_page_length: "0", fields: JSON.stringify(fields) });
}

// --------------------------------------------------------------- assets --
const assetIndex = new Map<string, string>(); // frappe url -> local relative path
async function fetchAsset(fileUrl: string): Promise<string | undefined> {
  if (!fileUrl) return undefined;
  if (assetIndex.has(fileUrl)) return assetIndex.get(fileUrl);
  const abs = fileUrl.startsWith("http") ? fileUrl : `${FRAPPE_URL}${fileUrl}`;
  try {
    const res = await fetch(abs, { headers: { Authorization: TOKEN } }); // token also covers /private/files
    if (!res.ok) return undefined;
    const buf = Buffer.from(await res.arrayBuffer());
    const base = (fileUrl.split("/").pop() || "file").split("?")[0];
    const local = `assets/${base}`;
    await mkdir(ASSETS_DIR, { recursive: true });
    await writeFile(join(OUT_DIR, local), buf);
    assetIndex.set(fileUrl, local);
    return local;
  } catch {
    return undefined;
  }
}

// ------------------------------------------------- EditorJS block parsing --
const FILE_URL_RE = /(?:\/private)?\/files\/[^\s"'\\)<>]+/g;
const QUIZ_SHORTCODE_RE = /\{\{\s*Quiz\(\s*["']([^"']+)["']\s*\)\s*\}\}/g;

/** Parse a Course Lesson.content (EditorJS JSON string) into normalized blocks +
 *  the set of LMS Quiz docnames it references. */
async function parseLessonContent(raw: string): Promise<{ blocks: NormBlock[]; quizNames: Set<string> }> {
  const blocks: NormBlock[] = [];
  const quizNames = new Set<string>();
  let doc: any;
  try {
    doc = JSON.parse(raw || "{}");
  } catch {
    // Some older lessons store plain HTML — treat the whole thing as rich text.
    if (raw) blocks.push({ kind: "richtext", html: raw });
    for (const m of raw?.matchAll(QUIZ_SHORTCODE_RE) || []) quizNames.add(m[1]);
    return { blocks, quizNames };
  }

  for (const b of doc.blocks || []) {
    const type = b.type;
    const data = b.data || {};
    if (type === "quiz") {
      const q = data.quiz || data.name || data.id;
      if (q) {
        quizNames.add(q);
        blocks.push({ kind: "quiz", quiz: q });
      }
    } else if (type === "image") {
      const src: string = data?.file?.url || data?.url || "";
      const local = await fetchAsset(src);
      if (local) blocks.push({ kind: "image", asset: local, caption: data.caption || undefined });
    } else if (type === "embed" || type === "video") {
      const url: string = data.embed || data.source || data.url || "";
      if (url) blocks.push({ kind: "video", provider: providerOf(url), url });
    } else {
      // paragraph / header / list / etc. -> rich text. Re-host any inline /files/ images.
      let html: string = data.text || data.html || textFromList(data) || "";
      for (const m of html.matchAll(FILE_URL_RE)) {
        const local = await fetchAsset(m[0]);
        if (local) html = html.replaceAll(m[0], local);
      }
      for (const m of html.matchAll(QUIZ_SHORTCODE_RE)) quizNames.add(m[1]);
      if (html.trim()) blocks.push({ kind: "richtext", html });
    }
  }
  return { blocks, quizNames };
}
function providerOf(url: string): "bunny" | "youtube" | "url" {
  if (/youtu\.?be/i.test(url)) return "youtube";
  if (/bunny|mediadelivery|b-cdn/i.test(url)) return "bunny";
  return "url";
}
function textFromList(data: any): string {
  if (Array.isArray(data.items)) return data.items.map((i: any) => (typeof i === "string" ? i : i.content || "")).join("<br>");
  return "";
}

// ------------------------------------------------------------- quizzes --
const quizCache: Record<string, NormQuiz> = {};
async function loadQuiz(name: string): Promise<NormQuiz | undefined> {
  if (quizCache[name]) return quizCache[name];
  let doc: any;
  try {
    doc = await getDoc("LMS Quiz", name);
  } catch {
    return undefined;
  }
  const questions: NormQuestion[] = [];
  for (const row of doc.questions || []) {
    const qName = row.question || row.name;
    if (!qName) continue;
    let q: any;
    try {
      q = await getDoc("LMS Question", qName);
    } catch {
      continue;
    }
    const options: NormOption[] = [];
    for (let i = 1; i <= 4; i++) {
      const text = q[`option_${i}`];
      if (text) options.push({ text, correct: !!(q[`is_correct_${i}`] === 1 || q[`is_correct_${i}`] === "1") });
    }
    questions.push({
      source: qName,
      text: q.question || "",
      type: q.type || q.question_type || (options.length ? "Choices" : "User Input"),
      options,
      explanation: q.explanation || "",
    });
  }
  const quiz: NormQuiz = { source: name, title: doc.title || name, questions };
  quizCache[name] = quiz;
  return quiz;
}

// --------------------------------------------------------------- walk --
async function extract(): Promise<Bundle> {
  const bundle: Bundle = { site: FRAPPE_URL, courses: [], quizzes: {}, users: [], enrollments: [] };

  const courseNames = await listNames("LMS Course");
  for (const cName of courseNames) {
    const course = await getDoc("LMS Course", cName);
    const cover = course.image ? await fetchAsset(course.image) : undefined;
    const norm: NormCourse = {
      source: cName,
      title: course.title || cName,
      description: course.description || "",
      cover,
      sections: [],
    };

    for (const chapRow of course.chapters || []) {
      const chapName = chapRow.chapter || chapRow.name;
      if (!chapName) continue;
      const chap = await getDoc("Course Chapter", chapName);
      const section: NormSection = { source: chapName, title: chap.title || chapName, lessons: [] };

      for (const lesRow of chap.lessons || []) {
        const lesName = lesRow.lesson || lesRow.name;
        if (!lesName) continue;
        const les = await getDoc("Course Lesson", lesName);
        const { blocks, quizNames } = await parseLessonContent(les.content || "");
        for (const qn of quizNames) {
          const quiz = await loadQuiz(qn);
          if (quiz) bundle.quizzes[qn] = quiz;
        }
        section.lessons.push({
          source: lesName,
          title: les.title || lesName,
          blocks,
          quizzes: [...quizNames],
        });
      }
      norm.sections.push(section);
    }
    bundle.courses.push(norm);
    console.log(`  + ${norm.title}  (${norm.sections.length} sections, ${norm.sections.reduce((n, s) => n + s.lessons.length, 0)} lessons)`);
  }

  // users + enrollments + progress
  const progress = await listRows("LMS Course Progress", ["member", "lesson", "status", "course"]);
  const progByMemberCourse = new Map<string, string[]>();
  for (const p of progress) {
    if (String(p.status).toLowerCase().startsWith("complete")) {
      const key = `${p.member}::${p.course}`;
      (progByMemberCourse.get(key) || progByMemberCourse.set(key, []).get(key)!).push(p.lesson);
    }
  }
  const enrollments = await listRows("LMS Enrollment", ["member", "course"]);
  const seenUsers = new Set<string>();
  for (const e of enrollments) {
    const email = String(e.member).toLowerCase();
    if (!seenUsers.has(email)) {
      seenUsers.add(email);
      let u: any = {};
      try {
        u = await getDoc("User", e.member);
      } catch {
        /* ignore */
      }
      bundle.users.push({ email, firstName: u.first_name || email, lastName: u.last_name || "" });
    }
    const done = progByMemberCourse.get(`${e.member}::${e.course}`) || [];
    bundle.enrollments.push({ email, course: e.course, completedLessons: done, completed: done.length > 0 });
  }

  return bundle;
}

// ------------------------------------------------------------- report --
function report(b: Bundle) {
  const lessons = b.courses.reduce((n, c) => n + c.sections.reduce((m, s) => m + s.lessons.length, 0), 0);
  const videos = b.courses.reduce(
    (n, c) => n + c.sections.reduce((m, s) => m + s.lessons.reduce((k, l) => k + l.blocks.filter((x) => x.kind === "video").length, 0), 0),
    0,
  );
  console.log("\n===== DRY RUN REPORT =====");
  console.log(`Courses:      ${b.courses.length}`);
  console.log(`Lessons:      ${lessons}`);
  console.log(`Quizzes:      ${Object.keys(b.quizzes).length}`);
  console.log(`Video blocks: ${videos}  (Bunny/YouTube embeds — not downloaded)`);
  console.log(`Assets saved: ${assetIndex.size}  (images/PDFs -> ${ASSETS_DIR})`);
  console.log(`Users:        ${b.users.length}`);
  console.log(`Enrollments:  ${b.enrollments.length}`);
  console.log("Judgment calls: verify quiz counts vs Desk /app/lms-quiz; confirm video provider split (bunny vs url).");
  console.log("==========================\n");
}

// --------------------------------------------------------------- load --
// LOAD half — wire to YOUR Supabase schema. Verify every table/column name
// against your migrations before removing the --dry-run guard.
async function loadToSupabase(_b: Bundle, _schoolId: string) {
  // import { createClient } from "@supabase/supabase-js";
  // const db = createClient(must("SUPABASE_URL"), must("SUPABASE_SERVICE_KEY"));
  // For each course: upsert into `courses` (school_id, title, description, cover);
  //   upload assets/<file> to Supabase storage, store the public URL.
  //   For each section -> `sections`; each lesson -> `lessons` + expand blocks into `lesson_blocks`.
  //   For each quiz -> `quizzes` + `quiz_questions`; link the lesson's quiz block to the quiz row.
  // For users: invite (no password) -> `users`; enrollments -> `enrollments` (+ completedLessons -> progress).
  // Videos: keep the embed URL, or kick off a Bunny->Mux ingest and store the Mux playback id.
  throw new Error("LOAD not wired yet — map to your Supabase tables, then remove this guard.");
}

// --------------------------------------------------------------- main --
(async () => {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Extracting from ${FRAPPE_URL} ...`);
  const bundle = await extract();

  await writeFile(join(OUT_DIR, "bundle.json"), JSON.stringify(bundle, null, 2));
  await writeFile(
    join(OUT_DIR, "assets_index.json"),
    JSON.stringify(Object.fromEntries(assetIndex), null, 2),
  );
  report(bundle);

  if (DRY_RUN) {
    console.log(`DRY RUN — wrote ${join(OUT_DIR, "bundle.json")}. No Supabase writes. Re-run with --load to import.`);
    return;
  }
  if (!SCHOOL_ID) throw new Error("--load requires --school <id> (or SCHOOL_ID) to target a school.");
  await loadToSupabase(bundle, SCHOOL_ID);
  console.log("LOAD_OK");
})().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
