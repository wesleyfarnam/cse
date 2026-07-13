"""Unit tests for the pure logic of provision_worker.

These run with plain python3 (no bench, no Frappe):
    python3 test_provision_worker.py
The subprocess-facing bits are exercised through Runner(dry_run=True), which
short-circuits every external call, so provision() can be driven end-to-end
here without touching a site.
"""

import base64
import os
import tempfile
import unittest

import provision_worker as w


class TestPureHelpers(unittest.TestCase):
	def test_b64_roundtrip(self):
		for s in ["", "hello", "acme.staging.test", "café · #C41E3A"]:
			self.assertEqual(w.b64d(w.b64e(s)), s)

	def test_parse_job_valid(self):
		line = "JOB|" + "|".join(
			w.b64e(x) for x in ["Acme Fed", "acme.staging.test", "#0055FF", "/files/logo.png"]
		)
		out = f"bench noise\nsome log\n{line}\nNone\n"
		job = w.parse_job(out)
		self.assertEqual(job["name"], "Acme Fed")
		self.assertEqual(job["hostname"], "acme.staging.test")
		self.assertEqual(job["brand_color"], "#0055FF")
		self.assertEqual(job["logo"], "/files/logo.png")

	def test_parse_job_none_when_absent(self):
		self.assertIsNone(w.parse_job("no job here\nNone\n"))
		self.assertIsNone(w.parse_job(""))

	def test_parse_job_empty_optional_fields(self):
		line = "JOB|" + "|".join(w.b64e(x) for x in ["F", "f.staging.test", "", ""])
		job = w.parse_job(line)
		self.assertEqual(job["brand_color"], "")
		self.assertEqual(job["logo"], "")

	def test_parse_job_ignores_malformed(self):
		self.assertIsNone(w.parse_job("JOB|only|three"))

	def test_build_execute_cmd(self):
		self.assertEqual(
			w.build_execute_cmd("s", "a.b.c"),
			[w.BENCH, "--site", "s", "execute", "a.b.c"],
		)
		cmd = w.build_execute_cmd("s", "a.b", {"x": "y"})
		self.assertIn("--kwargs", cmd)
		self.assertEqual(cmd[cmd.index("--kwargs") + 1], '{"x": "y"}')

	def test_cap_log(self):
		self.assertEqual(w.cap_log("short", 100), "short")
		big = "x" * 500
		capped = w.cap_log(big, 100)
		self.assertTrue(capped.startswith("…(truncated)…"))
		self.assertTrue(capped.endswith("x" * 100))


class TestResolveLogo(unittest.TestCase):
	def test_absolute_existing(self):
		with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
			path = f.name
		self.addCleanup(os.unlink, path)
		self.assertEqual(w.resolve_logo_path(path, "console.test", "/bench"), path)

	def test_public_files_url(self):
		with tempfile.TemporaryDirectory() as d:
			site = "console.test"
			pub = os.path.join(d, "sites", site, "public", "files")
			os.makedirs(pub)
			open(os.path.join(pub, "l.png"), "w").close()
			self.assertEqual(
				w.resolve_logo_path("/files/l.png", site, d),
				os.path.join(d, "sites", site, "public", "files", "l.png"),
			)

	def test_private_files_url(self):
		with tempfile.TemporaryDirectory() as d:
			site = "console.test"
			priv = os.path.join(d, "sites", site, "private", "files")
			os.makedirs(priv)
			open(os.path.join(priv, "p.png"), "w").close()
			self.assertEqual(
				w.resolve_logo_path("/private/files/p.png", site, d),
				os.path.join(d, "sites", site, "private", "files", "p.png"),
			)

	def test_missing_returns_none(self):
		self.assertIsNone(w.resolve_logo_path("", "c", "/b"))
		self.assertIsNone(w.resolve_logo_path("/files/nope.png", "c", "/b"))


class TestOrchestration(unittest.TestCase):
	def test_dry_run_runner_never_executes(self):
		r = w.Runner(dry_run=True)
		rc, out = r.run(["definitely-not-a-real-binary", "--boom"])
		self.assertEqual(rc, 0)
		self.assertIn("[dry-run]", out)

	def test_provision_dry_run_walks_all_steps(self):
		r = w.Runner(dry_run=True)
		job = {
			"name": "Acme Fed",
			"hostname": "acme.staging.test",
			"brand_color": "#0055FF",
			"logo": "/files/logo.png",
		}
		ok, log = w.provision(r, job)
		self.assertTrue(ok)
		for label in ["new-site", "branding + roles", "certificate rule",
					  "curriculum", "federation admin", "smoke test"]:
			self.assertIn(label, log)
		self.assertIn("provisioned OK", log)


if __name__ == "__main__":
	unittest.main(verbosity=2)
