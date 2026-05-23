/* global React, T, PHOTOS, Btn, Pill, Eyebrow, Photo, CountUp, FeatIcon, Header, Footer, CTABand, NAV */
// site-saas-pages.jsx — page components for the SaaS-styled site.

const { useState } = React;

// ─── DATA ──────────────────────────────────────────────────────────────────
const COACH_LEVELS = [
  {
    t: 'Ring Corner Certification', tag: 'Entry credential',
    d: 'Qualifies coaches to corner athletes at sanctioned events. The first step in the coaching education pathway — the entry point into every higher tier.',
    photo: PHOTOS.coachKids,
    extras: [
      'Rules, scoring & athlete safety at sanctioned events',
      'Corner protocol · between-rounds management',
      'One-year credential renewable through ongoing assessment',
    ],
  },
  {
    t: 'Bronze', tag: 'Basic instructor / coach',
    d: 'For coaches developing athletes for competition or recreation. Builds on Ring Corner with the fundamentals of running training and preparing fighters to compete.',
    photo: PHOTOS.karateWinner,
    extras: [
      'Session planning & technique progression',
      'Strength & conditioning for combat sports',
      'First-time competitor preparation',
    ],
  },
  {
    t: 'Silver', tag: 'National level',
    d: 'For coaches preparing athletes for national competition. Adds tactical depth, opponent analysis, and the discipline needed to bring fighters to a national standard.',
    photo: PHOTOS.sparAction,
    extras: [
      'Tactical game planning & fight IQ',
      'Periodization for national-level cycles',
      'Cornering at sanctioned national events',
    ],
  },
  {
    t: 'Gold', tag: 'International / world-class',
    d: 'For coaches preparing athletes for world-class competition. The top of the pathway — international and Olympic-track development, where every detail decides the outcome.',
    photo: PHOTOS.podium,
    extras: [
      'Olympic-track athlete development',
      'Advanced tactical preparation & opponent intelligence',
      'High-performance peaking for world championships',
      'Mentoring coaches at Bronze and Silver levels',
    ],
  },
];

const ATHLETE_LEVELS = [
  {
    t: 'Fundamentals', tag: 'Entry',
    d: 'Technique, conditioning, and functional movement. The foundation every athlete needs before they enter a competition setting.',
    photo: PHOTOS.athletePortrait,
    extras: [
      'Stance, footwork & defensive fundamentals',
      'Functional movement & general conditioning',
      'Sport-specific drilling and partner work',
    ],
  },
  {
    t: 'Competition Prep', tag: 'Club / local',
    d: 'Sparring, tactics, and ring readiness. Bridges the gap between gym work and stepping into sanctioned competition for the first time.',
    photo: PHOTOS.boxingRing,
    extras: [
      'Structured controlled sparring',
      'Tactical fundamentals & ring craft',
      'Pre-fight cuts, rest, and warm-up protocols',
    ],
  },
  {
    t: 'National-level Prep', tag: 'National',
    d: 'Structured preparation for national competition. Builds on the basics with periodized training and the mental approach national-caliber athletes need.',
    photo: PHOTOS.worldWinner,
    extras: [
      'Periodization across the competitive year',
      'Advanced tactical drilling & game planning',
      'Strength, conditioning, recovery for high volume',
    ],
  },
  {
    t: 'Elite / International', tag: 'World-class',
    d: 'World-class and Olympic-track development. The top of the athlete pathway — where world-championship and Olympic preparation get decided in the smallest details.',
    photo: PHOTOS.silverMedalist,
    extras: [
      'Olympic-track training cycles',
      'Opponent analysis & matchup-specific prep',
      'High-performance peaking and recovery',
      'Travel, weight cuts, and international-stage readiness',
    ],
  },
];

// ─── REUSABLES ─────────────────────────────────────────────────────────────
const Pathway = ({ levels }) => (
  <div>
    {levels.map((l, i) => (
      <div key={l.t} className={`s-level ${i === levels.length - 1 ? 'top' : ''}`}>
        <div className="s-level-photo"><img src={l.photo} alt={l.t} referrerPolicy="no-referrer" /></div>
        <div className="s-level-body">
          <div className="s-level-title-row">
            <h3 className="s-h3" style={{ color: 'inherit' }}>{l.t}</h3>
            <span className="s-level-tag">{l.tag}</span>
          </div>
          <p>{l.d}</p>
        </div>
      </div>
    ))}
  </div>
);

// ─── INTERACTIVE COMPONENTS ────────────────────────────────────────────────

// Auto-advancing 4-step launch journey (How It Works)
const JOURNEY_STEPS = [
  {
    t: 'Onboard & brand',
    d: 'We set up your instance in your colors, logo, and domain — coaches and athletes see your organization throughout.',
    photo: PHOTOS.coachesConferring,
    extras: ['Your brandmark, colors, and domain', 'Branded coach + athlete experience', 'Custom email & certificate templates'],
  },
  {
    t: 'Adapt the curriculum',
    d: "We tailor the program to your organization's requirements, level names, language, and local rules.",
    photo: PHOTOS.karateWinner,
    extras: ['Map levels to your existing structure', 'Local rules + language', 'Region-specific assessment criteria'],
  },
  {
    t: 'Launch to your coaches',
    d: 'Coaches enroll, train, and certify under your brand. You own the credential.',
    photo: PHOTOS.coachKids,
    extras: ['Self-serve coach enrollment', 'Assessments + knowledge checks', 'Issue branded credentials'],
  },
  {
    t: 'Ongoing updates',
    d: 'We keep the curriculum current. No maintenance on your side.',
    photo: PHOTOS.podium,
    extras: ['Quarterly content reviews', 'Standards alignment', 'New modules as the sport evolves'],
  },
];

const LaunchJourney = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [progress, setProgress] = useState(0);
  const DURATION = 7000;

  const frozen = paused || stopped;

  // Refs read by the rAF loop without re-creating the loop on every state change.
  const frozenRef = React.useRef(frozen);
  frozenRef.current = frozen;
  const lengthRef = React.useRef(JOURNEY_STEPS.length);

  React.useEffect(() => {
    let cancelled = false;
    let last = performance.now();
    const tick = (now) => {
      if (cancelled) return;
      const dt = now - last;
      last = now;
      if (!frozenRef.current) {
        setProgress((p) => {
          const next = p + dt / DURATION;
          if (next >= 1) {
            setActive((a) => (a + 1) % lengthRef.current);
            return 0;
          }
          return next;
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => { cancelled = true; };
  }, []);

  const step = JOURNEY_STEPS[active];

  return (
    <div className="journey">
      <div className="journey-tabs">
        {JOURNEY_STEPS.map((s, i) => (
          <div
            key={s.t}
            className={`journey-tab ${i === active ? 'active' : ''}`}
            onClick={() => { setActive(i); setProgress(0); setStopped(true); }}
          >
            <span className="journey-num">{i + 1}</span>
            <span className="journey-name">{s.t}</span>
            {i === active && !stopped && <div className="journey-progress" style={{ width: `${progress * 100}%` }} />}
          </div>
        ))}
      </div>

      <div className="journey-panel" key={active}>
        <div className="journey-content">
          <div className="journey-eyebrow">Step {active + 1} of {JOURNEY_STEPS.length}</div>
          <h3 className="journey-h">{step.t}</h3>
          <p className="journey-p">{step.d}</p>
          <ul className="journey-extras">
            {step.extras.map(x => <li key={x}>{x}</li>)}
          </ul>
        </div>
        <div className="journey-visual">
          <div className="journey-badge">
            <div className="journey-badge-num">{String(active + 1).padStart(2, '0')}</div>
            <div className="journey-badge-text">
              <small>Step</small>
              <b>{step.t}</b>
            </div>
          </div>
          <img src={step.photo} alt={step.t} referrerPolicy="no-referrer" />
        </div>
      </div>

      <div className="journey-controls">
        {stopped ? (
          <>
            <button className="journey-btn" onClick={() => { setStopped(false); setProgress(0); }}>▶ Restart auto-advance</button>
            <span>Auto-advance stopped · navigate manually with the tabs</span>
          </>
        ) : (
          <>
            <button className="journey-btn" onClick={() => setPaused(p => !p)}>{paused ? '▶ Resume' : '❚❚ Pause'}</button>
            <span>{paused ? 'Paused — click Resume' : 'Auto-advancing every 7s · click a step to take control'}</span>
          </>
        )}
      </div>
    </div>
  );
};

// Interactive pathway with ascending-bar selector (Coach + Athlete pages)
const InteractivePathway = ({ levels }) => {
  const [active, setActive] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [progress, setProgress] = useState(0);
  const DURATION = 5500;

  const frozenRef = React.useRef(stopped);
  frozenRef.current = stopped;
  const lengthRef = React.useRef(levels.length);
  lengthRef.current = levels.length;

  React.useEffect(() => {
    let cancelled = false;
    let last = performance.now();
    const tick = (now) => {
      if (cancelled) return;
      const dt = now - last;
      last = now;
      if (!frozenRef.current) {
        setProgress((p) => {
          const next = p + dt / DURATION;
          if (next >= 1) {
            setActive((a) => (a + 1) % lengthRef.current);
            return 0;
          }
          return next;
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => { cancelled = true; };
  }, []);

  const handlePick = (i) => { setActive(i); setProgress(0); setStopped(true); };
  const l = levels[active];

  return (
    <div className="pathway">
      <div className="pathway-hint">
        <span className="pathway-hint-dot" />
        Tap any tier to see what it covers
        {!stopped && <span className="pathway-hint-tail"> · auto-cycling</span>}
      </div>
      <div className="pathway-bars" role="tablist">
        {levels.map((lvl, i) => (
          <button
            key={lvl.t}
            role="tab"
            aria-selected={i === active}
            className={`pathway-bar ${i === active ? 'active' : ''} ${!stopped && i === 0 ? 'pulse' : ''}`}
            onClick={() => handlePick(i)}
            style={{ ['--bar-h']: `${30 + i * 23}%` }}
          >
            <div className="pathway-bar-fill">
              {i === active && !stopped && (
                <div className="pathway-bar-progress" style={{ height: `${progress * 100}%` }} />
              )}
            </div>
            <div className="pathway-bar-num">{String(i + 1).padStart(2, '0')}</div>
            <div className="pathway-bar-name">{lvl.t.split(' ')[0]}</div>
            <div className="pathway-bar-tag">{lvl.tag}</div>
          </button>
        ))}
      </div>
      <div className="pathway-panel" key={active}>
        <div className="pathway-content">
          <Pill>{l.tag}</Pill>
          <h3>{l.t}</h3>
          <p>{l.d}</p>
          {l.extras && (
            <ul className="pathway-extras">
              {l.extras.map(x => <li key={x}>{x}</li>)}
            </ul>
          )}
          <div className="pathway-nav">
            <button disabled={active === 0} onClick={() => handlePick(active - 1)}>← Previous</button>
            <button disabled={active === levels.length - 1} onClick={() => handlePick(active + 1)}>Next →</button>
            {stopped && (
              <button onClick={() => { setStopped(false); setProgress(0); }}>↻ Auto-cycle</button>
            )}
          </div>
        </div>
        <div className="pathway-photo">
          <img src={l.photo} alt={l.t} referrerPolicy="no-referrer" />
        </div>
      </div>
    </div>
  );
};

// Before/after switch for Athlete Training "The gap"
const GAP_DATA = {
  without: [
    { metric: 'Variable', t: 'Talent pool', d: 'Gym-by-gym inconsistency. Top talent emerges by accident, not by design.' },
    { metric: 'Higher risk', t: 'Athlete safety', d: 'Different gyms prep at different levels. Sanctioned events expose the gap.' },
    { metric: 'Ad-hoc', t: 'Competition prep', d: 'No shared standard. Every club reinvents what "ready" means.' },
  ],
  with: [
    { metric: 'Raised', t: 'Talent pool', d: 'A standard every club trains against. The whole organization gets stronger.' },
    { metric: 'Lower risk', t: 'Athlete safety', d: 'Consistent prep before sanctioned events. Safer competitors across the board.' },
    { metric: 'Standardized', t: 'Competition prep', d: 'One program. Every club aligned. Athletes show up ready.' },
  ],
};

const GapToggle = () => {
  const [state, setState] = useState('without');
  return (
    <div className="gap">
      <div className="gap-switch">
        <button className={state === 'without' ? 'on' : ''} onClick={() => setState('without')}>Without a standardized pathway</button>
        <button className={state === 'with' ? 'on with' : ''} onClick={() => setState('with')}>With CSE athlete training</button>
      </div>
      <div className="gap-cards" key={state}>
        {GAP_DATA[state].map(item => (
          <div className={`gap-card ${state === 'with' ? 'on' : 'off'}`} key={item.t}>
            <div className="gap-metric">{item.metric}</div>
            <h4>{item.t}</h4>
            <p>{item.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Case Study story expander (3 acts)
const STORY_ACTS = [
  {
    t: 'A credible coaching standard.',
    body: "USA Kickboxing needed standardized coaching education — a credible, consistent way to certify the coaches and ring corners responsible for athlete safety at sanctioned events. Building that program in-house would mean curriculum development, assessment design, and technology most organizations don't have the time or resources to take on.",
    points: ['No standardized coaching education across clubs', 'Athlete safety at sanctioned events', 'Years of curriculum + tech work to build in-house'],
    stat: 'Before CSE · no shared standard',
  },
  {
    t: 'Ring Corner through Gold.',
    body: 'A complete coaching education program spanning Ring Corner certification through Bronze, Silver, and Gold levels — with assessments, knowledge requirements, and a clear progression pathway. The Ring Corner credential qualifies coaches to corner athletes for one year at sanctioned events. Curriculum is kept current with regular updates.',
    points: ['Ring Corner → Bronze → Silver → Gold', 'Assessments + knowledge checks', 'Branded as USA Kickboxing', 'Curriculum kept current'],
    stat: '5 stages · Ring Corner → Gold',
  },
  {
    t: 'Live, recognized, in active use.',
    body: '18 coaches in the first national certification class — built and delivered across five structured stages. A live, recognized certification program in active use at the national level.',
    points: ['Live & recognized at the national level', 'Used by Team USA coaches', 'Updated annually as standards evolve'],
    stat: '18 coaches certified',
  },
];

const CaseStudyStory = () => {
  const [active, setActive] = useState(2);
  const cols = ['3fr 1fr 1fr', '1fr 3fr 1fr', '1fr 1fr 3fr'][active];
  return (
    <div className="story" style={{ gridTemplateColumns: cols }}>
      {STORY_ACTS.map((a, i) => (
        <div
          key={a.t}
          className={`story-card ${i === active ? 'open' : 'closed'}`}
          onClick={() => setActive(i)}
        >
          <div className="story-act">Act {String(i + 1).padStart(2, '0')}</div>
          <h3 className="story-h">{a.t}</h3>
          {i === active && (
            <div className="story-body">
              <p>{a.body}</p>
              <ul>{a.points.map(p => <li key={p}>{p}</li>)}</ul>
              <div className="story-stat">{a.stat}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── PAGES ─────────────────────────────────────────────────────────────────
const PageHome = ({ go }) => (
  <>
    {/* HERO */}
    <section className="s-hero">
      <div className="s-container s-hero-grid">
        <div>
          <Eyebrow>Built for organizations</Eyebrow>
          <h1 className="s-h1">Launch your organization's own coach certification program — without building it from scratch.</h1>
          <p className="s-lede" style={{ marginTop: 24 }}>
            A complete, proven certification curriculum, delivered under your brand. We build, host, and maintain it. You certify your coaches.
          </p>
          <div className="s-hero-cta-row">
            <Btn onClick={() => go('demo')}>Book a Demo →</Btn>
            <Btn variant="secondary" onClick={() => go('how')}>See how it works →</Btn>
          </div>
          <div className="s-hero-trust">
            <img src={PHOTOS.uskLogo} alt="USA Kickboxing" referrerPolicy="no-referrer" />
            <div className="s-hero-trust-text">
              <b>Trusted at the national level.</b><br />
              CSE built the certification program behind USA Kickboxing's coaching education.
            </div>
          </div>
        </div>
        <Photo src={PHOTOS.sparKick} alt="Athletes mid-bout" className="s-hero-art" />
      </div>
    </section>

    {/* VALUE PROPS — editorial column treatment, not card-with-icon */}
    <section className="s-section soft">
      <div className="s-container">
        <div className="s-head left" style={{ marginBottom: 56, maxWidth: 720 }}>
          <Eyebrow>What you get</Eyebrow>
          <h2 className="s-h2">A program your organization can stand behind.</h2>
        </div>
        <div className="s-pillars">
          {[
            { t: 'Branded as yours', d: 'Your logo, your colors, your domain. Athletes and coaches see your organization, not ours.' },
            { t: 'Proven & recognized', d: 'A curriculum already running at the national level, built to a recognized standard.' },
            { t: 'Fully managed', d: 'We handle the platform, hosting, and ongoing curriculum updates. No tech team required.' },
          ].map((p, i) => (
            <div className="s-pillar" key={p.t}>
              <div className="s-pillar-num">{String(i + 1).padStart(2, '0')} —</div>
              <h3 className="s-pillar-title">{p.t}</h3>
              <p className="s-pillar-body">{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* HOW IT WORKS condensed */}
    <section className="s-section">
      <div className="s-container">
        <div className="s-head">
          <Eyebrow>From zero to launched</Eyebrow>
          <h2 className="s-h2">How it works.</h2>
          <p className="s-lede">Three steps from sign-on to certifying your first cohort.</p>
        </div>
        <div className="g-3">
          {[
            { t: 'Brand it', d: "We stand up your organization's instance in your identity." },
            { t: 'Launch it', d: 'Coaches and athletes start the program under your name.' },
            { t: 'Certify', d: 'They progress through recognized levels; you own the credential.' },
          ].map((p, i) => (
            <div className="s-card s-step" key={p.t}>
              <div className="s-step-num">{i + 1}</div>
              <h3 className="s-h3">{p.t}</h3>
              <p className="s-body" style={{ marginTop: 8 }}>{p.d}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Btn variant="ghost" onClick={() => go('how')}>See the full model →</Btn>
        </div>
      </div>
    </section>

    {/* PROOF — full-bleed photo strip + stat */}
    <section className="s-section dark">
      <div className="s-container">
        <div className="g-split">
          <div>
            <Eyebrow variant="light">Proof</Eyebrow>
            <h2 className="s-h2" style={{ color: '#fff' }}>Already trusted at the national level.</h2>
          </div>
          <div>
            <p className="s-lede">CSE built and delivered the certification program behind USA Kickboxing's coaching education.</p>
            <div className="g-3" style={{ marginTop: 32 }}>
              <div className="s-stat"><div className="s-stat-num"><CountUp to={18} /></div><div className="s-stat-label" style={{ color: 'rgba(255,255,255,0.65)' }}>Coaches in the first national certification class</div></div>
              <div className="s-stat"><div className="s-stat-num"><CountUp to={5} /></div><div className="s-stat-label" style={{ color: 'rgba(255,255,255,0.65)' }}>Certification stages · Ring Corner → Gold</div></div>
              <div className="s-stat"><div className="s-stat-num"><CountUp to={3} suffix="×" /></div><div className="s-stat-label" style={{ color: 'rgba(255,255,255,0.65)' }}>World Champion · CSE founder</div></div>
            </div>
            <div style={{ marginTop: 32 }}>
              <Btn variant="secondary" onClick={() => go('case')}>Read the case study →</Btn>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* PROGRAMS PREVIEW — visual progression grid */}
    <section className="s-section">
      <div className="s-container">
        <div className="s-head">
          <Eyebrow>The certification pathway</Eyebrow>
          <h2 className="s-h2">A complete coaching pathway — from cornering to world-class.</h2>
        </div>
        <div className="program-grid">
          {[
            { t: 'Ring Corner', d: 'Entry credential. Qualifies coaches to corner athletes at sanctioned events.', photo: PHOTOS.coachKids },
            { t: 'Bronze', d: 'Develops athletes for competition or recreation.', photo: PHOTOS.karateWinner },
            { t: 'Silver', d: 'Prepares athletes for national competition.', photo: PHOTOS.sparAction },
            { t: 'Gold', d: 'Prepares athletes for international, world-class competition.', photo: PHOTOS.podium },
          ].map((p, i, arr) => (
            <div className={`program-card ${i === arr.length - 1 ? 'top' : ''}`} key={p.t} onClick={() => go('programs')}>
              <div className="program-photo"><img src={p.photo} alt={p.t} referrerPolicy="no-referrer" /></div>
              <div className="program-body">
                <div className="program-num">{`0${i + 1}`} <span>{`/ 0${arr.length}`}</span></div>
                <h3 className="program-title">{p.t}</h3>
                <p className="program-text">{p.d}</p>
                <div className="program-rungs">
                  {arr.map((_, j) => <div key={j} className={`program-rung ${j <= i ? 'on' : ''}`} />)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Btn variant="ghost" onClick={() => go('programs')}>Explore the programs →</Btn>
        </div>
      </div>
    </section>

    {/* ATHLETE TEASER */}
    <section className="s-section soft">
      <div className="s-container">
        <div className="g-split-reverse">
          <div>
            <Eyebrow>Not just coaches</Eyebrow>
            <h2 className="s-h2">Your athletes too.</h2>
            <p className="s-lede" style={{ marginTop: 16 }}>A structured development pathway from fundamentals to elite prep, under the same brand.</p>
            <div style={{ marginTop: 24 }}>
              <Btn onClick={() => go('athletes')}>See athlete training →</Btn>
            </div>
          </div>
          <Photo src={PHOTOS.athletePortrait} alt="Young competitor" style={{ aspectRatio: '4/5' }} />
        </div>
      </div>
    </section>

    <CTABand go={go} />
  </>
);

const PageHowItWorks = ({ go }) => (
  <>
    <section className="s-hero">
      <div className="s-container s-hero-grid">
        <div>
          <Eyebrow>The white-label model</Eyebrow>
          <h1 className="s-h1">Your program. Our engine.</h1>
          <p className="s-lede" style={{ marginTop: 24 }}>
            We've already built the hard part — a complete certification system. You launch it as your organization's own, and we keep it running.
          </p>
          <div className="s-hero-cta-row"><Btn onClick={() => go('demo')}>Book a Demo →</Btn></div>
        </div>
        <Photo src={PHOTOS.coachesConferring} alt="Team USA coaches working together" className="s-hero-art" />
      </div>
    </section>

    <section className="s-section soft">
      <div className="s-container">
        <div className="g-split">
          <div>
            <Eyebrow>The model</Eyebrow>
            <h2 className="s-h2">Finished, recognized, branded as yours.</h2>
          </div>
          <p className="s-body" style={{ fontSize: 18 }}>
            Organizations don't need to build curriculum or software from scratch. CSE provides a finished, recognized certification program as a branded instance you control. We build it, host it, and maintain it. Your coaches and athletes experience it as your organization's own.
          </p>
        </div>
      </div>
    </section>

    <section className="s-section">
      <div className="s-container">
        <div className="s-head">
          <Eyebrow>The launch journey</Eyebrow>
          <h2 className="s-h2">Four steps to live.</h2>
          <p className="s-lede">Click any step — or watch it run automatically.</p>
        </div>
        <LaunchJourney />
      </div>
    </section>

    {/* FAQ */}
    <section className="s-section soft">
      <div className="s-container" style={{ maxWidth: 880 }}>
        <div className="s-head">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="s-h2">Questions organizations ask.</h2>
        </div>
        <FAQ items={[
          { q: 'Is it really our brand?', a: 'Yes. Coaches and athletes see your organization throughout — your logo, colors, and domain. CSE stays behind the scenes.', open: true },
          { q: 'Who builds and maintains it?', a: "We do. You don't need a tech team or a curriculum team." },
          { q: 'How long until we launch?', a: "A organization instance can be stood up and branded quickly; timeline depends on how much localization you want. We'll map it in the demo." },
          { q: 'Can we adapt the content to our requirements?', a: "Yes. The curriculum is built to be adapted to your organization's levels, language, and rules." },
          { q: 'What does it run on?', a: 'A managed platform we host. You get the program; we handle the infrastructure.' },
        ]} />
      </div>
    </section>

    <CTABand go={go} />
  </>
);

const FAQ = ({ items }) => {
  const [open, setOpen] = useState(items.findIndex(i => i.open));
  return (
    <div className="s-faq">
      {items.map((it, i) => (
        <div key={it.q} className={`s-faq-item ${i === open ? 'open' : ''}`} onClick={() => setOpen(i === open ? -1 : i)}>
          <div className="s-faq-q">
            <h4>{it.q}</h4>
            <div className="s-faq-icon">{i === open ? '−' : '+'}</div>
          </div>
          {i === open && <p className="s-faq-a">{it.a}</p>}
        </div>
      ))}
    </div>
  );
};

const PagePrograms = ({ go }) => (
  <>
    <section className="s-hero">
      <div className="s-container s-hero-grid">
        <div>
          <Pill>For Coaches</Pill>
          <h1 className="s-h1" style={{ marginTop: 16 }}>A complete coach certification pathway.</h1>
          <p className="s-lede" style={{ marginTop: 24 }}>
            From cornering an athlete safely to preparing world-class competitors — one progressive, recognized pathway, delivered under your brand.
          </p>
          <div className="s-hero-cta-row">
            <Btn onClick={() => go('demo')}>Book a Demo →</Btn>
            <Btn variant="secondary" onClick={() => go('athletes')}>Athlete pathway →</Btn>
          </div>
        </div>
        <Photo src={PHOTOS.coachKids} alt="Coach with young competitors" className="s-hero-art" />
      </div>
    </section>

    <section className="s-section">
      <div className="s-container">
        <div className="s-head left" style={{ maxWidth: 720 }}>
          <Eyebrow>The pathway</Eyebrow>
          <h2 className="s-h2">Four progressive levels.</h2>
        </div>
        <InteractivePathway levels={COACH_LEVELS} />
      </div>
    </section>

    <section className="s-section soft">
      <div className="s-container">
        <div className="g-split">
          <div>
            <Eyebrow>Adapt it</Eyebrow>
            <h2 className="s-h2">Map it to your structure.</h2>
          </div>
          <p className="s-body" style={{ fontSize: 18 }}>
            Level names and requirements are adaptable — your organization can map them to your own structure and rules. The curriculum is updated regularly so coaches always train against current standards.
          </p>
        </div>
      </div>
    </section>

    {/* Cross-link to athletes */}
    <section className="s-section">
      <div className="s-container">
        <div className="s-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: 32 }}>
          <div>
            <Pill>Pairs with</Pill>
            <h3 className="s-h3" style={{ marginTop: 12 }}>Athlete Training</h3>
            <p className="s-body" style={{ marginTop: 6 }}>CSE-certified coaches deliver the athlete pathway. One connected system.</p>
          </div>
          <Btn variant="secondary" onClick={() => go('athletes')}>See athlete pathway →</Btn>
        </div>
      </div>
    </section>

    <CTABand go={go} />
  </>
);

const PageAthletes = ({ go }) => (
  <>
    <section className="s-hero">
      <div className="s-container s-hero-grid">
        <div>
          <Pill>For Athletes</Pill>
          <h1 className="s-h1" style={{ marginTop: 16 }}>A complete development pathway for your athletes — not just your coaches.</h1>
          <p className="s-lede" style={{ marginTop: 24 }}>
            A structured training and competition-prep curriculum that takes your athletes from fundamentals to world-class readiness — branded as your organization's own.
          </p>
          <div className="s-hero-cta-row"><Btn onClick={() => go('demo')}>Book a Demo →</Btn></div>
        </div>
        <Photo src={PHOTOS.flyingKick} alt="Athletes mid-air kick" className="s-hero-art" />
      </div>
    </section>

    <section className="s-section soft">
      <div className="s-container">
        <div className="s-head">
          <Eyebrow>The gap</Eyebrow>
          <h2 className="s-h2">Organizations invest in coaches. Athlete development is often left to chance.</h2>
          <p className="s-lede">Toggle below to see what changes when athlete development gets standardized.</p>
        </div>
        <GapToggle />
      </div>
    </section>

    <section className="s-section">
      <div className="s-container">
        <div className="s-head left" style={{ maxWidth: 720 }}>
          <Eyebrow>The pathway</Eyebrow>
          <h2 className="s-h2">Four progressive stages.</h2>
          <p className="s-tiny" style={{ marginTop: 16 }}>Stage names are adaptable — organizations can map them to their own levels.</p>
        </div>
        <InteractivePathway levels={ATHLETE_LEVELS} />
      </div>
    </section>

    <section className="s-section soft">
      <div className="s-container">
        <div className="s-head">
          <Eyebrow>What the pathway develops</Eyebrow>
          <h2 className="s-h2">Built across the areas that decide competitive outcomes.</h2>
        </div>
        <p className="s-lede" style={{ textAlign: 'center', margin: '0 auto 40px' }}>
          The athlete curriculum builds across the areas that decide competitive outcomes: technical skill development, functional and sport-specific conditioning, sequential skill progression, sparring and tactical readiness, and structured competition preparation.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {['Technical skill development', 'Functional & sport-specific conditioning', 'Sequential skill progression', 'Sparring & tactical readiness', 'Structured competition prep'].map(t => (
            <Pill key={t}>{t}</Pill>
          ))}
        </div>
      </div>
    </section>

    <section className="s-section dark">
      <div className="s-container">
        <div className="g-split-reverse">
          <div>
            <Eyebrow variant="light">White-label</Eyebrow>
            <h2 className="s-h2" style={{ color: '#fff' }}>The athlete program runs inside your organization's branded platform — maintained and updated by CSE.</h2>
            <div style={{ marginTop: 24 }}>
              <Btn variant="secondary" onClick={() => go('how')}>How the white-label works →</Btn>
            </div>
          </div>
          <Photo src={PHOTOS.fighterVictory} alt="Athlete moment" style={{ aspectRatio: '4/5' }} />
        </div>
      </div>
    </section>

    <section className="s-section">
      <div className="s-container">
        <div className="s-head">
          <Eyebrow>One connected system</Eyebrow>
          <h2 className="s-h2">Ties to the coaching program.</h2>
        </div>
        <div className="g-2">
          <div className="s-card" style={{ padding: 32 }}>
            <Pill variant="gray">Programs</Pill>
            <h3 className="s-h3" style={{ marginTop: 12 }}>Coach Certification</h3>
            <p className="s-body" style={{ marginTop: 6 }}>Ring Corner → Gold. The coaches who deliver this pathway.</p>
            <div style={{ marginTop: 20 }}><Btn variant="ghost" onClick={() => go('programs')}>See coach pathway →</Btn></div>
          </div>
          <div className="s-card" style={{ padding: 32 }}>
            <Pill variant="gray">How It Works</Pill>
            <h3 className="s-h3" style={{ marginTop: 12 }}>The white-label model</h3>
            <p className="s-body" style={{ marginTop: 6 }}>Brand it · launch · ongoing updates.</p>
            <div style={{ marginTop: 20 }}><Btn variant="ghost" onClick={() => go('how')}>How it works →</Btn></div>
          </div>
        </div>
      </div>
    </section>

    <CTABand go={go} />
  </>
);

const PageCaseStudy = ({ go }) => (
  <>
    <section className="s-hero">
      <div className="s-container s-hero-grid">
        <div>
          <Pill>Case study</Pill>
          <h1 className="s-h1" style={{ marginTop: 16 }}>The certification program behind USA Kickboxing.</h1>
          <p className="s-lede" style={{ marginTop: 24 }}>
            How CSE built and delivered a recognized coaching education program for a national organization — the proof that the model works.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="s-logo-tile" style={{ padding: 24 }}>
            <img src={PHOTOS.uskLogo} alt="USA Kickboxing" referrerPolicy="no-referrer" style={{ height: 80 }} />
          </div>
          <div className="s-card feature">
            <div className="s-tiny" style={{ marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.1, fontWeight: 600, color: T.muted }}>At a glance</div>
            <p className="s-body" style={{ fontSize: 15 }}>
              <b style={{ color: T.ink }}>18 coaches certified</b> in USA Kickboxing's first national certification class. Delivered by CSE across five structured stages.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section className="s-section">
      <div className="s-container">
        <CaseStudyStory />
      </div>
    </section>

    {/* Pull quote */}
    <section className="s-section soft">
      <div className="s-container" style={{ maxWidth: 880, textAlign: 'center' }}>
        <div style={{ fontSize: 64, color: T.red, lineHeight: 0.3, fontFamily: 'Georgia, serif', marginBottom: 8 }}>“</div>
        <h2 className="s-h2" style={{ letterSpacing: '-0.015em' }}>An extreme honor to be one of 18 certified WAKO Team USA coaches.</h2>
        <p className="s-tiny" style={{ marginTop: 24, fontSize: 15 }}>
          <b style={{ color: T.ink }}>Tom Whitaker</b> · Owner, Metro Krav Maga & Kickboxing · Illinois
        </p>
      </div>
    </section>

    <section className="s-section">
      <div className="s-container">
        <div className="g-3">
          <Photo src={PHOTOS.tatamiWinner} alt="Winner on the tatami" style={{ aspectRatio: '4/3' }} />
          <Photo src={PHOTOS.bronzeMedalist} alt="Bronze medalist" style={{ aspectRatio: '4/3' }} />
          <Photo src={PHOTOS.fighterVictory} alt="Fighter post-victory" style={{ aspectRatio: '4/3' }} />
        </div>
      </div>
    </section>

    <section className="s-section dark">
      <div className="s-container">
        <div className="g-split">
          <h2 className="s-h2" style={{ color: '#fff' }}>Available to your organization — under your brand.</h2>
          <p className="s-lede">
            What CSE built for USA Kickboxing is the same system available to your organization — under your brand. You skip the years of development and launch a proven program as your own.
          </p>
        </div>
      </div>
    </section>

    <CTABand go={go} headline="Want a program like this under your organization's brand?" />
  </>
);

const PageWhyCSE = ({ go }) => (
  <>
    <section className="s-section" style={{ paddingTop: 96 }}>
      <div className="s-container" style={{ maxWidth: 880, textAlign: 'center' }}>
        <Eyebrow>Why organizations choose CSE</Eyebrow>
        <h1 className="s-h1">The only partner that gives you the whole stack — branded as yours.</h1>
        <p className="s-lede" style={{ margin: '24px auto 0' }}>
          Most providers sell you content or software. CSE delivers both — a finished, recognized program on a platform we run for you.
        </p>
      </div>
    </section>

    <section className="s-section">
      <div className="s-container">
        <div className="s-pillars cols-2">
          {[
            { t: 'Finished, recognized curriculum', d: 'Not a template to fill in. A complete coaching and athlete pathway already proven at the national level.' },
            { t: 'First mover with proof', d: 'A live organization implementation behind us, not a pitch deck. The model is already working.' },
            { t: 'Fully managed platform', d: 'We host and maintain everything. You launch a program, not a tech project.' },
            { t: 'Built for organizations', d: 'Designed around coach credentialing, athlete safety, and the standards that recognition and sanctioning demand.' },
          ].map((p, i) => (
            <div className="s-pillar" key={p.t}>
              <div className="s-pillar-num">{String(i + 1).padStart(2, '0')} —</div>
              <h3 className="s-pillar-title">{p.t}</h3>
              <p className="s-pillar-body">{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="s-section soft">
      <div className="s-container">
        <div className="s-head">
          <Eyebrow>Built to standard</Eyebrow>
          <h2 className="s-h2">Built to the standard that recognizes the sport.</h2>
          <p className="s-lede">
            Kickboxing is a US Olympic & Paralympic recognized sport, governed globally by WAKO (World Association of Kickboxing Organizations) and its national member federations. CSE's program is built to that standard — so the credential you issue carries weight.
          </p>
        </div>
        <div className="g-3">
          {[
            { tag: 'Sport status', t: 'US Olympic & Paralympic recognized' },
            { tag: 'Global body', t: 'WAKO · world governing body' },
            { tag: 'CSE\u2019s standard', t: 'Built to match' },
          ].map(c => (
            <div className="s-card" key={c.tag}>
              <div className="s-tiny" style={{ textTransform: 'uppercase', letterSpacing: 0.1, fontWeight: 600 }}>{c.tag}</div>
              <h4 className="s-h4" style={{ marginTop: 10 }}>{c.t}</h4>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="s-section">
      <div className="s-container">
        <div className="s-head"><h2 className="s-h2">Buy vs build.</h2></div>
        <div className="g-2">
          <div className="s-card" style={{ padding: 36 }}>
            <h4 className="s-h4" style={{ color: T.muted }}>Build it yourself</h4>
            <p className="s-body" style={{ marginTop: 12 }}>Curriculum design, assessment writing, hosting, content updates — years of work, every cost on your side, no proof of recognition.</p>
          </div>
          <div className="s-card" style={{ padding: 36, background: T.ink, color: '#fff', borderColor: T.ink }}>
            <h4 className="s-h4" style={{ color: T.red }}>With CSE</h4>
            <p className="s-body" style={{ marginTop: 12, color: 'rgba(255,255,255,0.78)' }}>Finished pathway. Recognized standard. Branded as yours. Hosted and maintained. Launch in a fraction of the time.</p>
          </div>
        </div>
      </div>
    </section>

    <CTABand go={go} />
  </>
);

const PageAbout = ({ go }) => (
  <>
    <section className="s-hero">
      <div className="s-container s-hero-grid">
        <div>
          <Pill variant="gray">About</Pill>
          <h1 className="s-h1" style={{ marginTop: 16 }}>We build the programs organizations run.</h1>
          <p className="s-lede" style={{ marginTop: 24 }}>
            Combat Sports Education exists to give organizations a credible, recognized certification program without the years of development behind it.
          </p>
        </div>
        <Photo src={PHOTOS.ringBout} alt="USA Kickboxing ring action" className="s-hero-art" />
      </div>
    </section>

    <section className="s-section soft">
      <div className="s-container">
        <div className="g-split">
          <div>
            <Eyebrow>Our background</Eyebrow>
            <h2 className="s-h2">Built from inside the sport.</h2>
          </div>
          <p className="s-body" style={{ fontSize: 18 }}>
            Combat Sports Education built its certification curriculum from inside the sport — developed and delivered at the national level, refined through real coaching education, and kept current as standards evolve. The result is a program organizations can adopt with confidence and run as their own.
          </p>
        </div>
      </div>
    </section>

    {/* CREDIBILITY STATS */}
    <section className="s-section">
      <div className="s-container">
        <div className="g-3">
          <div className="s-stat"><div className="s-stat-num"><CountUp to={3} suffix="×" /></div><div className="s-stat-label">World Kickboxing Champion · founder</div></div>
          <div className="s-stat"><div className="s-stat-num"><CountUp to={18} /></div><div className="s-stat-label">Coaches in USA Kickboxing's first national certification class</div></div>
          <div className="s-stat"><div className="s-stat-num"><CountUp to={5} /></div><div className="s-stat-label">Certification stages · Ring Corner → Gold</div></div>
        </div>
      </div>
    </section>

    {/* FOUNDER · Bybee */}
    <section className="s-section soft">
      <div className="s-container">
        <div className="s-founder">
          <div className="s-founder-photo"><img src={PHOTOS.bybeePortrait} alt="David Bybee" referrerPolicy="no-referrer" /></div>
          <div>
            <Pill>Founder</Pill>
            <h2 className="s-h2" style={{ marginTop: 14 }}>David Bybee</h2>
            <p className="s-tiny" style={{ marginTop: 6, fontSize: 14, color: T.muted }}>Founder, Combat Sports Education · Director of Coaches, USA Kickboxing</p>
            <p className="s-body" style={{ marginTop: 20, fontSize: 17 }}>
              David Bybee is a 3× World Kickboxing Champion with a 36-year journey in martial arts, a 6th-degree black belt in Joe Lewis Fighting Systems, and a BJJ black belt. He serves as Director of Coaches for USA Kickboxing and, in 2018, was chosen as a Team USA Olympic coach. He owns and operates American MMA.
            </p>
            <div className="s-founder-credits">
              {[
                '3× World Kickboxing Champion',
                'WAKO Gold & Bronze Medalist',
                'Director of Coaches · USA Kickboxing',
                'Team USA Olympic Coach (2018)',
                '6th Degree Black Belt · JLFS',
                'BJJ Black Belt · Ricardo DeLaRiva lineage',
              ].map(t => <div key={t} className="s-founder-credit">{t}</div>)}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* FOUNDER · Bavelock */}
    <section className="s-section">
      <div className="s-container">
        <div className="s-founder reverse">
          <div>
            <Pill>VP of Education</Pill>
            <h2 className="s-h2" style={{ marginTop: 14 }}>Coach Ed Bavelock</h2>
            <p className="s-tiny" style={{ marginTop: 6, fontSize: 14, color: T.muted }}>Wrestling · Classic Melbourne kickboxing · Kimekai MMA, Melbourne</p>
            <p className="s-body" style={{ marginTop: 20, fontSize: 17 }}>
              Ed Bavelock of Kimekai MMA (Melbourne) has a background in wrestling and classic Melbourne kickboxing, and has coached numerous competitive combat-sports fighters.
            </p>
            <div className="s-founder-credits">
              {[
                'Wrestling background',
                'Classic Melbourne kickboxing',
                'Kimekai MMA · Melbourne',
                'Coached numerous competitive fighters',
                '35+ years coaching',
                'Pioneer of KB / MMA / Muay Thai in Australia',
              ].map(t => (
                <div key={t} className="s-founder-credit">{t}</div>
              ))}
            </div>
          </div>
          <div className="s-founder-photo"><img src={PHOTOS.bavelockPortrait} alt="Coach Ed Bavelock" referrerPolicy="no-referrer" style={{ objectPosition: 'center 25%' }} /></div>
        </div>
      </div>
    </section>

    <CTABand go={go} />
  </>
);

const PageBookDemo = ({ go }) => {
  const [submitted, setSubmitted] = useState(false);
  return (
    <>
      <section className="s-section" style={{ paddingTop: 64 }}>
        <div className="s-container">
          <div className="g-split">
            <div>
              <Pill>Book a Demo</Pill>
              <h1 className="s-h1" style={{ marginTop: 16 }}>See the platform in your organization's colors.</h1>
              <p className="s-lede" style={{ marginTop: 24 }}>
                A 30-minute walkthrough. We'll show you the certification pathway, how the white-label model works, and what it would take to launch under your brand.
              </p>

              <div style={{ marginTop: 48 }}>
                <h3 className="s-h3" style={{ marginBottom: 24 }}>What happens next.</h3>
                {[
                  { t: 'We reach out', d: 'A real person, not an autoresponder.' },
                  { t: 'We walk you through it', d: 'The program, the platform, and your branding options.' },
                  { t: 'We map your launch', d: "If it's a fit, we'll outline what going live looks like for your organization." },
                ].map((p, i) => (
                  <div key={p.t} style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                    <div className="s-step-num" style={{ flex: '0 0 28px' }}>{i + 1}</div>
                    <div>
                      <h4 className="s-h4">{p.t}</h4>
                      <p className="s-body" style={{ marginTop: 4, fontSize: 14 }}>{p.d}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="s-card" style={{ marginTop: 16 }}>
                <Pill variant="gray">Proof</Pill>
                <h4 className="s-h4" style={{ marginTop: 12 }}>Trusted at the national level.</h4>
                <div style={{ marginTop: 12 }}>
                  <Btn variant="ghost" onClick={() => go('case')}>Read the USA Kickboxing case study →</Btn>
                </div>
              </div>
            </div>

            <div className="s-card feature" style={{ padding: 36 }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(232,65,58,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24"><path d="M5 12l4 4 10-10" stroke={T.red} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <h3 className="s-h3">Thanks — we'll be in touch.</h3>
                  <p className="s-body" style={{ marginTop: 8 }}>A real person will reply within one business day to schedule your walkthrough.</p>
                </div>
              ) : (
                <form className="s-form" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
                  <div className="s-field"><label>Full name *</label><input required placeholder="Full name" /></div>
                  <div className="s-field"><label>Your role *</label><input required placeholder="e.g. Director of Coaching" /></div>
                  <div className="s-field full"><label>Organization *</label><input required placeholder="Your organization" /></div>
                  <div className="s-field"><label>Country *</label><input required placeholder="Country" /></div>
                  <div className="s-field"><label>Email *</label><input required type="email" placeholder="you@organization.org" /></div>
                  <div className="s-field full"><label>Phone (optional)</label><input placeholder="Phone" /></div>
                  <div className="s-field full"><label>Message (optional)</label><textarea placeholder="Tell us what your organization needs…" /></div>
                  <div className="full">
                    <Btn>Request my demo →</Btn>
                  </div>
                  <p className="s-tiny full" style={{ marginTop: 4 }}>
                    We'll reply within one business day to schedule a time. No commitment.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const PageLegal = ({ title, sections }) => (
  <section className="s-section" style={{ paddingTop: 64 }}>
    <div className="s-container" style={{ maxWidth: 920 }}>
      <p className="s-tiny" style={{ marginBottom: 8 }}>Last updated · —</p>
      <h1 className="s-h1">{title}</h1>
      <div className="g-split" style={{ marginTop: 48, gridTemplateColumns: '220px 1fr', gap: 48 }}>
        <div style={{ position: 'sticky', top: 96, alignSelf: 'start' }}>
          <Eyebrow variant="muted">Contents</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sections.map((s, i) => (
              <a key={s} href={`#sec-${i}`} style={{ fontSize: 14, color: T.muted, padding: '4px 0' }}>{String(i + 1).padStart(2, '0')} · {s}</a>
            ))}
          </div>
        </div>
        <div>
          {sections.map((s, i) => (
            <div key={s} id={`sec-${i}`} style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
                <span className="s-tiny" style={{ color: T.red, fontWeight: 700 }}>{String(i + 1).padStart(2, '0')}</span>
                <h3 className="s-h3">{s}</h3>
              </div>
              <p className="s-body">Standard policy text covering this section. Replace with final legal copy before launch.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const PagePrivacy = () => <PageLegal title="Privacy Policy" sections={['What we collect', 'How we use it', 'Where it lives (GoHighLevel)', 'Cookies & analytics', 'Your rights', 'Contact']} />;
const PageTerms = () => <PageLegal title="Terms of Use" sections={['Using this site', 'Demo requests & sales conversations', 'Intellectual property', 'Disclaimers', 'Limitation of liability', 'Governing law']} />;

// ─── APP ───────────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "style": "modern",
  "photo": "natural",
  "density": "standard"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [page, setPage] = useState(() => {
    const h = window.location.hash.slice(1);
    return ['home','how','programs','athletes','case','why','about','demo','privacy','terms'].includes(h) ? h : 'home';
  });

  const go = (id) => {
    setPage(id);
    window.location.hash = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  React.useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.slice(1);
      if (h && h !== page) setPage(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [page]);

  const modeClass = `style-${t.style} photo-${t.photo} density-${t.density}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: saasCss }} />
      <div className={`s-app ${modeClass}`}>
        <Header page={page} go={go} />
        <main>
          {page === 'home' && <PageHome go={go} />}
          {page === 'how' && <PageHowItWorks go={go} />}
          {page === 'programs' && <PagePrograms go={go} />}
          {page === 'athletes' && <PageAthletes go={go} />}
          {page === 'case' && <PageCaseStudy go={go} />}
          {page === 'why' && <PageWhyCSE go={go} />}
          {page === 'about' && <PageAbout go={go} />}
          {page === 'demo' && <PageBookDemo go={go} />}
          {page === 'privacy' && <PagePrivacy />}
          {page === 'terms' && <PageTerms />}
        </main>
        <Footer go={go} />
      </div>

      <TweaksPanel title="Site feel">
        <TweakSection label="Headline style" />
        <TweakRadio
          label="Type"
          value={t.style}
          options={['modern', 'serif', 'athletic']}
          onChange={(v) => setTweak('style', v)}
        />
        <TweakSection label="Photography" />
        <TweakRadio
          label="Treatment"
          value={t.photo}
          options={['natural', 'editorial', 'mono']}
          onChange={(v) => setTweak('photo', v)}
        />
        <TweakSection label="Spacing" />
        <TweakRadio
          label="Density"
          value={t.density}
          options={['tight', 'standard', 'spacious']}
          onChange={(v) => setTweak('density', v)}
        />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
