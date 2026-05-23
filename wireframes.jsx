/* global React */
const { useState } = React;

// ---------- Sketchy wireframe primitives ----------------------------------

const RED = '#E8413A';
const INK = '#1F2A37';
const PAPER = '#fbfaf6';
const MUTE = '#9aa0a6';

const wfCss = `
.wf {
  font-family: 'Architects Daughter', 'Patrick Hand', system-ui, sans-serif;
  color: ${INK};
  background: ${PAPER};
  width: 100%; height: 100%;
  overflow: hidden;
  position: relative;
}
.wf, .wf * { box-sizing: border-box; }

/* Page chrome inside an artboard */
.wf-chrome {
  display: flex; flex-direction: column;
  width: 100%; min-height: 100%;
}
.wf-section {
  position: relative;
  padding: 28px 56px;
  border-bottom: 1.5px dashed rgba(31,42,55,0.18);
}
.wf-section.dark {
  background: #f3f1ec;
}
.wf-section.tight { padding: 18px 56px; }

.wf-label {
  font-family: 'Caveat', cursive;
  font-size: 14px;
  color: ${MUTE};
  letter-spacing: 0.5px;
  text-transform: uppercase;
  position: absolute;
  top: 6px; right: 10px;
}

/* Sketchy element vocabulary */
.wf-box {
  border: 1.5px dashed ${INK};
  border-radius: 4px;
  padding: 14px 16px;
  position: relative;
  background: ${PAPER};
}
.wf-box.solid { border-style: solid; border-width: 1.5px; }
.wf-box.filled { background: #ebe7df; }
.wf-box.tinted { background: ${INK}; color: #fff; border-color: ${INK}; }

/* Image placeholder — diagonal cross */
.wf-img {
  border: 1.5px solid ${INK};
  position: relative;
  background:
    linear-gradient(to top right, transparent 49.5%, ${INK} 49.5%, ${INK} 50.5%, transparent 50.5%),
    linear-gradient(to top left, transparent 49.5%, ${INK} 49.5%, ${INK} 50.5%, transparent 50.5%),
    ${PAPER};
}
.wf-img.tinted {
  background:
    linear-gradient(to top right, transparent 49.5%, #fff 49.5%, #fff 50.5%, transparent 50.5%),
    linear-gradient(to top left, transparent 49.5%, #fff 49.5%, #fff 50.5%, transparent 50.5%),
    ${INK};
  border-color: ${INK};
}
.wf-img > span {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Caveat', cursive; font-size: 16px;
  color: ${MUTE};
  background: ${PAPER}; padding: 2px 8px;
  width: max-content; height: max-content;
  margin: auto;
  border-radius: 3px;
}
.wf-img.tinted > span { background: ${INK}; color: #ccc; }

/* Text-line placeholders */
.wf-lines { display: flex; flex-direction: column; gap: 7px; }
.wf-line {
  height: 8px; background: ${INK}; opacity: 0.55;
  border-radius: 2px;
}
.wf-line.short { width: 40%; }
.wf-line.med { width: 70%; }
.wf-line.long { width: 92%; }
.wf-line.thin { height: 5px; opacity: 0.4; }

/* Headline placeholder — big chunky block */
.wf-headline {
  display: flex; flex-direction: column; gap: 9px;
}
.wf-headline > div {
  height: 22px; background: ${INK}; border-radius: 3px;
}
.wf-headline.huge > div { height: 32px; }
.wf-headline > div:nth-child(1) { width: 78%; }
.wf-headline > div:nth-child(2) { width: 60%; }
.wf-headline > div:nth-child(3) { width: 44%; }

/* Buttons */
.wf-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  border: 1.5px solid ${INK};
  border-radius: 4px;
  font-family: 'Caveat', cursive;
  font-size: 17px;
  color: ${INK};
  background: ${PAPER};
}
.wf-btn.primary {
  background: ${RED}; color: #fff; border-color: ${RED};
}
.wf-btn.ghost { background: transparent; }

/* Sketchy annotation */
.wf-note {
  font-family: 'Caveat', cursive;
  font-size: 16px;
  color: ${RED};
  line-height: 1.15;
}
.wf-note.ink { color: ${INK}; }
.wf-anno {
  position: absolute;
  font-family: 'Caveat', cursive;
  font-size: 15px;
  color: ${RED};
  pointer-events: none;
  white-space: nowrap;
}
.wf-anno::before {
  content: '↳';
  margin-right: 4px;
}

/* Neutral divider placeholder — actual motif TBD, see Divider Explorations */
.wf-divider {
  height: 18px;
  display: flex; align-items: center; justify-content: center;
  gap: 10px;
  background: ${PAPER};
  border-top: 1.2px dashed rgba(31,42,55,0.25);
  border-bottom: 1.2px dashed rgba(31,42,55,0.25);
}
.wf-divider::before, .wf-divider::after {
  content: ''; flex: 1; height: 1px; background: rgba(31,42,55,0.18);
}
.wf-divider span {
  font-family: 'Caveat', cursive; font-size: 13px; color: ${MUTE};
  white-space: nowrap;
}

/* CTA band — no decorative stripe; clean panel + outline accent */
.wf-cta-accent {
  position: absolute; left: 56px; top: 50%; transform: translateY(-50%);
  width: 3px; height: 56px; background: ${RED};
}

/* Header bar */
.wf-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 56px;
  border-bottom: 1.5px solid ${INK};
  background: ${PAPER};
}
.wf-logo {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Caveat', cursive; font-weight: 700;
  font-size: 22px; color: ${INK};
}
.wf-logo::before {
  content: ''; width: 22px; height: 22px;
  background: ${RED};
  clip-path: polygon(0 100%, 35% 0, 100% 0, 65% 100%);
}
.wf-nav { display: flex; gap: 22px; font-family: 'Caveat', cursive; font-size: 17px; color: ${INK}; }
.wf-nav span { opacity: 0.75; }

/* Footer */
.wf-footer {
  padding: 24px 56px;
  background: ${INK}; color: #cfd4da;
  font-family: 'Caveat', cursive; font-size: 16px;
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 24px;
}

/* CTA band — clean navy, no stripe, accent left bar */
.wf-cta {
  background: ${INK}; color: #fff;
  padding: 36px 56px 36px 76px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 24px;
  position: relative; overflow: hidden;
}
.wf-cta h3 {
  font-family: 'Caveat', cursive; font-size: 28px; margin: 0; font-weight: 700;
}
.wf-cta p { margin: 4px 0 0; opacity: 0.7; font-size: 15px; font-family: 'Architects Daughter', sans-serif; }

/* Grids */
.wf-row { display: grid; gap: 18px; }
.wf-row.c2 { grid-template-columns: 1fr 1fr; }
.wf-row.c3 { grid-template-columns: 1fr 1fr 1fr; }
.wf-row.c4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
.wf-row.split-7-3 { grid-template-columns: 7fr 3fr; }
.wf-row.split-3-7 { grid-template-columns: 3fr 7fr; }

/* Step number */
.wf-num {
  width: 38px; height: 38px;
  border: 1.5px solid ${RED}; color: ${RED};
  border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-family: 'Caveat', cursive; font-weight: 700; font-size: 22px;
  background: ${PAPER};
}

/* Tag chip */
.wf-chip {
  display: inline-block;
  padding: 3px 10px;
  border: 1.2px dashed ${INK};
  border-radius: 999px;
  font-family: 'Caveat', cursive; font-size: 14px;
  color: ${INK}; background: ${PAPER};
}
.wf-chip.red { border-color: ${RED}; color: ${RED}; }
.wf-chip.solid { background: ${RED}; color: #fff; border-color: ${RED}; }

/* Form field */
.wf-field {
  height: 38px;
  border: 1.5px solid ${INK};
  border-radius: 4px;
  background: ${PAPER};
  display: flex; align-items: center; padding: 0 12px;
  font-family: 'Caveat', cursive; color: ${MUTE}; font-size: 16px;
}
.wf-field.tall { height: 92px; align-items: flex-start; padding: 10px 12px; }

/* Tiny captions */
.wf-cap {
  font-family: 'Caveat', cursive;
  font-size: 14px;
  color: ${MUTE};
}

/* Real logo */
.wf-realbrand { display: flex; align-items: center; gap: 10px; }
.wf-realbrand img { display: block; width: 40px; height: 40px; object-fit: contain; }
.wf-realbrand .wf-wordmark {
  font-family: 'Caveat', cursive; font-weight: 700;
  font-size: 18px; line-height: 1; color: ${INK};
}
.wf-realbrand .wf-wordmark small {
  display: block; font-size: 11px; color: ${MUTE}; letter-spacing: 0.5px;
  font-family: 'Architects Daughter', sans-serif; margin-top: 3px;
  text-transform: uppercase;
}
.wf-realbrand.dark .wf-wordmark { color: #fff; }
.wf-realbrand.dark .wf-wordmark small { color: #98a0aa; }

/* Logo placeholder pill */
.wf-logopill {
  height: 36px;
  border: 1.5px dashed ${INK}; opacity: 0.7;
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Caveat', cursive; font-size: 15px; color: ${MUTE};
  background: ${PAPER};
}

/* Real-photo treatment — unifies disparate source photos into one look.
   Editorial duotone: high-contrast grayscale + navy multiply overlay +
   light warm highlight pass + vignette. Tuneable via .photo-* variants. */
.wf-photo { position: relative; overflow: hidden; background: ${INK}; }
.wf-photo > img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
}
/* Default: duotone (navy + warm highlights) */
.wf-photo > img {
  filter: grayscale(1) contrast(1.18) brightness(1.04);
}
.wf-photo::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(160deg, ${INK} 0%, #2c3a4a 100%);
  mix-blend-mode: multiply;
  opacity: 0.55;
}
.wf-photo::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(120% 80% at 70% 30%, rgba(245, 213, 168, 0.18), transparent 55%),
    radial-gradient(120% 90% at 30% 100%, rgba(0,0,0,0.35), transparent 65%);
}

/* Variant: natural (just contrast, no duotone) */
.photo-natural > img { filter: contrast(1.06) saturate(0.95); }
.photo-natural::before { opacity: 0; }
.photo-natural::after { background: radial-gradient(120% 90% at 50% 100%, rgba(0,0,0,0.25), transparent 60%); }

/* Variant: mono — stark high-contrast black & white, no color */
.photo-mono > img { filter: grayscale(1) contrast(1.35) brightness(0.95); }
.photo-mono::before { background: ${INK}; opacity: 0.18; }
.photo-mono::after { background: radial-gradient(120% 90% at 50% 100%, rgba(0,0,0,0.45), transparent 65%); }

/* ===== Tweak modes ============================================== */

/* Fidelity: crisp — cleaner sans-serif, solid hairlines instead of dashed
   sketchy lines. Wireframe still, but presentation-ready. */
.fid-crisp .wf,
.fid-crisp .wf-cta,
.fid-crisp .wf-footer { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
.fid-crisp .wf-note,
.fid-crisp .wf-cap,
.fid-crisp .wf-label,
.fid-crisp .wf-num,
.fid-crisp .wf-wordmark,
.fid-crisp .wf-wordmark small,
.fid-crisp .wf-nav,
.fid-crisp .wf-nav span,
.fid-crisp .wf-btn,
.fid-crisp .wf-chip,
.fid-crisp .wf-img > span,
.fid-crisp .wf-field,
.fid-crisp .wf-footer,
.fid-crisp .wf-footer div,
.fid-crisp .wf-cta h3,
.fid-crisp .wf-cta p,
.fid-crisp .wf-divider span {
  font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
  font-weight: 500;
  letter-spacing: 0;
}
.fid-crisp .wf-note.ink { font-weight: 600; }
.fid-crisp .wf-cta h3 { font-weight: 700; letter-spacing: -0.01em; }
.fid-crisp .wf-num { font-weight: 700; }
.fid-crisp .wf-box {
  border-style: solid; border-width: 1px;
  border-color: rgba(31,42,55,0.28);
  border-radius: 6px;
}
.fid-crisp .wf-box.filled { background: #efece6; }
.fid-crisp .wf-section { border-bottom-style: solid; border-bottom-color: rgba(31,42,55,0.12); }
.fid-crisp .wf-header { border-bottom: 1px solid rgba(31,42,55,0.18); }
.fid-crisp .wf-img { border-width: 1px; }
.fid-crisp .wf-field { border-width: 1px; }
.fid-crisp .wf-divider { border-top-style: solid; border-bottom-style: solid; border-color: rgba(31,42,55,0.12); }
.fid-crisp .wf-chip { border-style: solid; border-width: 1px; }
.fid-crisp .wf-btn { border-radius: 6px; font-weight: 600; }
.fid-crisp .wf-anno { font-family: 'Inter', system-ui, sans-serif !important; font-weight: 500; }

/* Fidelity: block — kill all text, keep shapes & color. A pure
   layout/rhythm view. */
.fid-block .wf-label,
.fid-block .wf-anno,
.fid-block .wf-cap,
.fid-block .wf-note,
.fid-block .wf-img > span,
.fid-block .wf-num,
.fid-block .wf-wordmark,
.fid-block .wf-nav,
.fid-block .wf-nav span,
.fid-block .wf-chip,
.fid-block .wf-footer h3,
.fid-block .wf-footer div,
.fid-block .wf-footer,
.fid-block .wf-cta h3,
.fid-block .wf-cta p,
.fid-block .wf-divider span,
.fid-block .wf-field { color: transparent !important; }
.fid-block .wf-btn { color: transparent !important; min-width: 100px; }
.fid-block .wf-btn::before { content: ''; display: inline-block; width: 60px; height: 8px; background: currentColor; opacity: 0; }
.fid-block .wf-chip { background: rgba(31,42,55,0.15); border-color: rgba(31,42,55,0.25); min-width: 60px; min-height: 16px; }
.fid-block .wf-chip.red, .fid-block .wf-chip.solid { background: ${RED}; border-color: ${RED}; }
.fid-block .wf-num { background: ${RED}; border-radius: 50%; }
.fid-block .wf-headline > div { background: ${INK}; }
.fid-block .wf-line { background: ${INK}; opacity: 0.35; }
.fid-block .wf-divider { background: transparent; }
.fid-block .wf-divider::before, .fid-block .wf-divider::after { background: rgba(31,42,55,0.2); }
.fid-block .wf-realbrand img { filter: none; }
.fid-block .wf-wordmark { width: 80px; }
.fid-block .wf-section .wf-cap { background: rgba(31,42,55,0.15); border-radius: 3px; min-height: 6px; max-height: 8px; display: inline-block; min-width: 60px; }

/* Annotation toggle: clean hides section labels (top-right "Hero · …" tags)
   and red-margin annotations. Headline-quote callouts stay because they
   double as placeholder content. */
.ann-clean .wf-label,
.ann-clean .wf-anno { display: none !important; }
`;

// ---------- Tiny atoms -----------------------------------------------------

const Box = ({ children, className = '', style }) =>
  <div className={`wf-box ${className}`} style={style}>{children}</div>;

const Headline = ({ size = 'med', lines = 3 }) =>
  <div className={`wf-headline ${size === 'huge' ? 'huge' : ''}`}>
    {Array.from({ length: lines }).map((_, i) => <div key={i} />)}
  </div>;

// Real headline text rendered in the wireframe sketchy voice.
const Heading = ({ size = 'huge', children, color }) => {
  const fs = size === 'mega' ? 48 : size === 'huge' ? 38 : size === 'big' ? 28 : size === 'med' ? 22 : 18;
  return (
    <div className="wf-note ink" style={{ fontWeight: 700, fontSize: fs, lineHeight: 1.08, color: color || INK, textWrap: 'pretty' }}>
      {children}
    </div>
  );
};

// Real body / subhead text — Architects Daughter so it still reads as wireframe.
const Sub = ({ children, color, max = 640, size = 16 }) => (
  <div style={{ fontFamily: 'Architects Daughter, sans-serif', fontSize: size, color: color || INK, lineHeight: 1.5, maxWidth: max, textWrap: 'pretty' }}>
    {children}
  </div>
);

// [FILL] markers — wrap copy that needs a real fact supplied before launch.
const Fill = ({ children }) => (
  <span style={{ background: '#fff2c2', color: '#8a6300', padding: '1px 6px', borderRadius: 3, fontFamily: 'Caveat, cursive', fontSize: 15, border: '1px dashed #b88a00' }}>
    [FILL: {children}]
  </span>
);

// Eyebrow — small uppercase label above headlines
const Eyebrow = ({ children, color }) => (
  <div style={{ fontFamily: 'Architects Daughter, sans-serif', fontSize: 12, color: color || RED, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
    {children}
  </div>
);

const Lines = ({ n = 3, widths }) => {
  const defaultWidths = ['long', 'long', 'med', 'long', 'short'];
  return (
    <div className="wf-lines">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={`wf-line ${(widths || defaultWidths)[i % 5]}`} />
      ))}
    </div>
  );
};

const Img = ({ h = 200, label = 'image', tinted = false, style }) =>
  <div className={`wf-img ${tinted ? 'tinted' : ''}`} style={{ height: h, ...style }}>
    <span>{label}</span>
  </div>;

// Real photos pulled from public WAKO USA / GL Sports sources. Used wherever
// the wireframe benefits from showing real content rather than a placeholder.
const PHOTOS = {
  // Founder portraits (still hot-linked from source pages)
  bybeePortrait: 'https://i0.wp.com/wakousa.org/wp-content/uploads/2024/01/3-3.png?fit=600%2C900&ssl=1',
  bavelockPortrait: 'https://glsports.co.uk/wp-content/uploads/sites/943/2024/11/0-2.jpg',

  // Local action / coach / athlete library
  coachesConferring: 'assets/photo-coaches-conferring.jpg',      // 2 TEAM USA coaches mid-conversation
  ringBout:          'assets/photo-ring-bout.jpg',                // 2 fighters w/ USA Kickboxing logo
  tatamiWinner:      'assets/photo-tatami-winner.jpg',            // ref raising winner's hand
  silverMedalist:    'assets/photo-silver-medalist.jpg',          // Caleb Lewis · 2024 World Champs silver
  karateWinner:      'assets/photo-karate-winner.jpg',            // ref + youth winner · USA Sport Karate
  bronzeMedalist:    'assets/photo-bronze-medalist.jpg',          // Armando Cardenas · 2024 World Champs bronze
  worldWinner:       'assets/photo-world-winner.jpg',             // Victor Aguilar · USA v UAE world champs
  boxingRing:        'assets/photo-boxing-ring.jpg',              // ring action, USA shorts
  flyingKick:        'assets/photo-flying-kick.jpg',              // mid-air kick exchange
  athletePortrait:   'assets/photo-athlete-portrait.jpg',         // young athlete close-up, blue gear
  coachKids:         'assets/photo-coach-kids.jpg',               // coach posing w/ two young competitors
  podium:            'assets/photo-podium.jpg',                   // WAKO World Championship podium
  sparKick:          'assets/photo-spar-kick.jpg',                // sparring kick exchange
  sparAction:        'assets/photo-spar-action.jpg',              // sparring action
  fighterVictory:    'assets/photo-fighter-victory.jpg',          // fighter w/ winnings post-fight

  // Logos
  uskLogo:  'https://i0.wp.com/wakousa.org/wp-content/uploads/2024/01/USA-Kickboxing-Logo-PMS.png?fit=300%2C217&ssl=1',
  ammaLogo: 'https://wakousa.org/wp-content/uploads/2024/01/AMERICAN-MIXED-MARTIAL-ARTS-LOGO.png',
};

// Real-photo frame — replaces <Img> wherever we have a real source.
// Treatment via CSS class .wf-photo (default = navy duotone). Switchable
// via the Tweaks panel's "Photo treatment" control.
const Photo = ({ src, h = 200, alt = '', pos = 'center 30%', fit = 'cover', style }) => {
  const { photo } = React.useContext(TweakCtx);
  const variant = photo === 'natural' ? 'photo-natural' : photo === 'mono' ? 'photo-mono' : '';
  return (
    <div className={`wf-photo ${variant}`} style={{ height: h, border: `1.5px solid ${INK}`, ...style }}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        style={{ objectPosition: pos, objectFit: fit }}
      />
    </div>
  );
};

// Real logo on a paper tile, used in proof/case-study spots.
const LogoTile = ({ src, alt = '', h = 64, pad = 8 }) => (
  <div style={{ height: h, border: `1.5px solid ${INK}`, background: PAPER, padding: pad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <img src={src} alt={alt} referrerPolicy="no-referrer" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
  </div>
);

const Btn = ({ children, variant = 'primary' }) =>
  <span className={`wf-btn ${variant}`}>{children}</span>;

const Anno = ({ children, style }) =>
  <div className="wf-anno" style={style}>{children}</div>;

const Label = ({ children }) => <div className="wf-label">{children}</div>;

// Tweak context — drives Divider motif, fidelity, annotation visibility
const TweakCtx = React.createContext({ divider: 'placeholder', fidelity: 'sketch', annotated: true, photo: 'duotone' });

// ---- Divider motif renderers (full-width, used in pages) ----
const DivPlaceholder = () => (
  <div className="wf-divider"><span>section divider · TBD — see explorations</span></div>
);
const DivMotifA = () => (
  <div style={{ background: PAPER, padding: '22px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
    <div style={{ position: 'absolute', left: 56, right: 56, height: 1, background: 'rgba(31,42,55,0.25)' }} />
    <div style={{ width: 32, height: 32, background: RED, clipPath: 'polygon(0 100%, 35% 0, 100% 0, 65% 100%)', position: 'relative', zIndex: 1 }} />
  </div>
);
const DivMotifB = () => (
  <div style={{ position: 'relative', height: 56, background: INK, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: -10, top: 14, width: '120%', height: 4, background: RED, transform: 'rotate(-3deg)', transformOrigin: 'left center' }} />
  </div>
);
const DivMotifC = () => (
  <div style={{ background: INK, height: 44, clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 100%)' }} />
);
const DivMotifD = () => (
  <div style={{ padding: '0' }}>
    <Img h={70} label="action photo strip" tinted style={{ borderLeft: 'none', borderRight: 'none' }} />
  </div>
);
const DivMotifE = () => (
  <div style={{ background: PAPER, padding: '22px 56px', display: 'flex', alignItems: 'center', gap: 18 }}>
    <div style={{ borderTop: `2px solid ${RED}`, borderBottom: `2px solid ${RED}`, padding: '4px 10px' }}>
      <div style={{ fontFamily: 'Caveat, cursive', fontWeight: 700, fontSize: 14, color: RED, letterSpacing: 1 }}>—</div>
    </div>
    <div style={{ fontSize: 14, color: INK, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'Architects Daughter, sans-serif' }}>Section title</div>
    <div style={{ flex: 1, height: 1, background: 'rgba(31,42,55,0.25)' }} />
  </div>
);
const DivMotifF = () => (
  <div style={{ position: 'relative', height: 22, background: INK }}>
    <div style={{ position: 'absolute', left: '12%', top: -6, width: 26, height: 26, background: RED }} />
  </div>
);

const Divider = () => {
  const { divider } = React.useContext(TweakCtx);
  switch (divider) {
    case 'A': return <DivMotifA />;
    case 'B': return <DivMotifB />;
    case 'C': return <DivMotifC />;
    case 'D': return <DivMotifD />;
    case 'E': return <DivMotifE />;
    case 'F': return <DivMotifF />;
    default: return <DivPlaceholder />;
  }
};

// ---------- Site chrome (header / footer / CTA band) ----------------------

const Header = ({ active = 'Home' }) => {
  const items = ['Home', 'How it works', 'Programs', 'Athlete Training', 'Case study', 'Why CSE', 'About'];
  return (
    <div className="wf-header">
      <div className="wf-realbrand">
        <img src="assets/cse-logo.png" alt="CSE" />
        <div className="wf-wordmark">CSE<small>Combat Sports Education</small></div>
      </div>
      <div className="wf-nav">
        {items.map(i =>
          <span key={i} style={i === active ? { color: INK, opacity: 1, borderBottom: `2px solid ${RED}`, paddingBottom: 2 } : null}>{i}</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="wf-nav" style={{ fontSize: 16 }}>
          <a href="https://combatsportseducation.ezycourse.com/en/all-products/" target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.85 }}>Login ↗</a>
        </span>
        <Btn>Book a Demo →</Btn>
      </div>
    </div>
  );
};

const Footer = () => (
  <div className="wf-footer" style={{ position: 'relative', paddingBottom: 44 }}>
    <div>
      <div className="wf-realbrand dark" style={{ marginBottom: 10 }}>
        <img src="assets/cse-logo.png" alt="CSE" />
        <div className="wf-wordmark">CSE<small>Combat Sports Education</small></div>
      </div>
      <div style={{ opacity: 0.75, maxWidth: 300, fontSize: 14, lineHeight: 1.5 }}>
        White-label coach & athlete certification for organizations worldwide.
      </div>
    </div>
    <div style={{ display: 'flex', gap: 44 }}>
      <div>
        <div style={{ color: '#fff', marginBottom: 8, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' }}>Programs</div>
        <div>Coach Certification</div>
        <div>Athlete Training</div>
      </div>
      <div>
        <div style={{ color: '#fff', marginBottom: 8, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' }}>Company</div>
        <div>How It Works</div>
        <div>Why CSE</div>
        <div>About</div>
        <div>Case Study</div>
      </div>
      <div>
        <div style={{ color: '#fff', marginBottom: 8, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' }}>Get Started</div>
        <div>Book a Demo</div>
        <div><a href="https://combatsportseducation.ezycourse.com/en/all-products/" target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'none' }}>CSE courses ↗</a></div>
      </div>
      <div>
        <div style={{ color: '#fff', marginBottom: 8, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' }}>Legal</div>
        <div>Privacy</div>
        <div>Terms</div>
      </div>
    </div>
    <div style={{ position: 'absolute', bottom: 10, left: 56, right: 56, fontSize: 12, opacity: 0.55, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 10 }}>© [YEAR] Combat Sports Education. All rights reserved.</div>
  </div>
);

const CTABand = ({ headline = 'Bring a recognized certification program to your organization.', sub = 'See the platform in your own colors. Book a 30-minute walkthrough — no commitment.' }) => (
  <div className="wf-cta">
    <div className="wf-cta-accent" />
    <div>
      <h3>{headline}</h3>
      <p>{sub}</p>
    </div>
    <Btn>Book a Demo →</Btn>
  </div>
);

// ---------- The 7 page wireframes -----------------------------------------

const PageHome = () => (
  <div className="wf-chrome">
    <Header active="Home" />

    {/* HERO */}
    <div className="wf-section dark" style={{ paddingTop: 56, paddingBottom: 56 }}>
      <Label>Hero · full-bleed photo + headline</Label>
      <div className="wf-row split-7-3" style={{ alignItems: 'center', gap: 32 }}>
        <div>
          <Eyebrow>Built for organizations</Eyebrow>
          <Heading size="mega">Launch your organization’s own coach certification program — without building it from scratch.</Heading>
          <div style={{ height: 18 }} />
          <Sub size={18} max={560}>
            A complete, proven certification curriculum, delivered under your brand. We build, host, and maintain it. You certify your coaches.
          </Sub>
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <Btn>Book a Demo →</Btn>
            <Btn variant="ghost">See how it works →</Btn>
          </div>
        </div>
        <Photo src={PHOTOS.sparKick} alt="Athletes mid-bout" h={420} />
      </div>
    </div>

    <Divider />

    {/* VALUE STRIP */}
    <div className="wf-section">
      <Label>Value prop strip · 3 pillars</Label>
      <div className="wf-row c3">
        {[
          { t: 'Branded as yours', d: "Your logo, your colors, your domain. Athletes and coaches see your organization, not ours." },
          { t: 'Proven & recognized', d: 'A curriculum already running at the national level, built to a recognized standard.' },
          { t: 'Fully managed', d: 'We handle the platform, hosting, and ongoing curriculum updates. No tech team required.' },
        ].map(p => (
          <Box key={p.t}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 24, height: 24, background: RED, clipPath: 'polygon(0 100%, 35% 0, 100% 0, 65% 100%)' }} />
              <Heading size="small">{p.t}</Heading>
            </div>
            <Sub size={14}>{p.d}</Sub>
          </Box>
        ))}
      </div>
    </div>

    {/* HOW IT WORKS condensed */}
    <div className="wf-section">
      <Label>How it works · 3 steps · links to full page</Label>
      <Eyebrow>From zero to launched</Eyebrow>
      <Heading size="big">How it works.</Heading>
      <div style={{ height: 18 }} />
      <div className="wf-row c3">
        {[
          { t: 'Brand it', d: "We stand up your organization’s instance in your identity." },
          { t: 'Launch it', d: 'Coaches and athletes start the program under your name.' },
          { t: 'Certify', d: 'They progress through recognized levels; you own the credential.' },
        ].map((p, i) => (
          <Box key={p.t}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span className="wf-num">{i + 1}</span>
              <Heading size="small">{p.t}</Heading>
            </div>
            <Sub size={14}>{p.d}</Sub>
          </Box>
        ))}
      </div>
      <div style={{ marginTop: 14 }}><Btn variant="ghost">See the full model →</Btn></div>
    </div>

    {/* PROOF SNIPPET */}
    <div className="wf-section dark">
      <Label>Proof snippet · USA Kickboxing</Label>
      <div className="wf-row split-3-7" style={{ alignItems: 'center', gap: 28 }}>
        <LogoTile src={PHOTOS.uskLogo} alt="USA Kickboxing" h={96} pad={14} />
        <div>
          <Eyebrow>Proof</Eyebrow>
          <Heading size="big">Already trusted at the national level.</Heading>
          <div style={{ height: 8 }} />
          <Sub size={16}>CSE built and delivered the certification program behind USA Kickboxing's coaching education.</Sub>
          <div style={{ marginTop: 12 }}><Btn variant="ghost">Read the case study →</Btn></div>
        </div>
      </div>
    </div>

    {/* PROGRAMS PREVIEW */}
    <div className="wf-section">
      <Label>Programs preview · 4 cards</Label>
      <Eyebrow>The certification pathway</Eyebrow>
      <Heading size="big">A complete coaching pathway — from cornering to world-class.</Heading>
      <div style={{ height: 18 }} />
      <div className="wf-row c4">
        {[
          { t: 'Ring Corner', d: 'Entry credential. Qualifies coaches to corner athletes at sanctioned events.' },
          { t: 'Bronze', d: 'Develops athletes for competition or recreation.' },
          { t: 'Silver', d: 'Prepares athletes for national competition.' },
          { t: 'Gold', d: 'Prepares athletes for international, world-class competition.' },
        ].map(p => (
          <Box key={p.t}>
            <Heading size="small">{p.t}</Heading>
            <div style={{ height: 6 }} />
            <Sub size={13}>{p.d}</Sub>
          </Box>
        ))}
      </div>
      <div style={{ marginTop: 14 }}><Btn variant="ghost">Explore the programs →</Btn></div>
    </div>

    {/* ATHLETE TEASER */}
    <div className="wf-section dark">
      <Label>Athlete teaser · cross-link to athlete training page</Label>
      <div className="wf-row split-7-3" style={{ alignItems: 'center', gap: 28 }}>
        <div>
          <Eyebrow>Not just coaches</Eyebrow>
          <Heading size="big">Your athletes too.</Heading>
          <div style={{ height: 8 }} />
          <Sub size={16}>A structured development pathway from fundamentals to elite prep, under the same brand.</Sub>
          <div style={{ marginTop: 12 }}><Btn variant="ghost">See athlete training →</Btn></div>
        </div>
        <Photo src={PHOTOS.athletePortrait} alt="Young competitor" h={200} />
      </div>
    </div>

    <CTABand />
    <Footer />
  </div>
);

const PageHowItWorks = () => (
  <div className="wf-chrome">
    <Header active="How it works" />

    {/* HERO */}
    <div className="wf-section dark" style={{ paddingTop: 56, paddingBottom: 56 }}>
      <Label>Hero · model headline</Label>
      <div className="wf-row split-7-3" style={{ alignItems: 'center', gap: 32 }}>
        <div>
          <Eyebrow>The white-label model</Eyebrow>
          <Heading size="mega">Your program. Our engine.</Heading>
          <div style={{ height: 18 }} />
          <Sub size={18} max={560}>
            We've already built the hard part — a complete certification system. You launch it as your organization’s own, and we keep it running.
          </Sub>
        </div>
        <Photo src={PHOTOS.coachesConferring} alt="Team USA coaches working together" h={320} />
      </div>
    </div>

    <Divider />

    {/* THE MODEL EXPLAINER */}
    <div className="wf-section">
      <Label>The model · plain explanation · text-led</Label>
      <div className="wf-row split-3-7" style={{ gap: 36, alignItems: 'flex-start' }}>
        <div>
          <Eyebrow>The model</Eyebrow>
          <Heading size="big">Finished, recognized, branded as yours.</Heading>
        </div>
        <div>
          <Sub size={17} max={720}>
            Organizations don't need to build curriculum or software from scratch. CSE provides a finished, recognized certification program as a branded instance you control. We build it, host it, and maintain it. Your coaches and athletes experience it as your organization’s own.
          </Sub>
        </div>
      </div>
    </div>

    <Divider />

    {/* 4-step process */}
    <div className="wf-section">
      <Label>4-step process · the launch journey</Label>
      <Heading size="med">The launch journey.</Heading>
      <div style={{ height: 18 }} />
      <div className="wf-row c4">
        {[
          { t: 'Onboard & brand', d: 'We set up your instance in your colors, logo, and domain.' },
          { t: 'Adapt the curriculum', d: "We tailor the program to your organization’s requirements and levels." },
          { t: 'Launch to your coaches', d: 'Coaches enroll, train, and certify under your brand.' },
          { t: 'Ongoing updates', d: 'We keep the curriculum current — no maintenance on your side.' },
        ].map((p, i, arr) => (
          <Box key={p.t} className="filled" style={{ position: 'relative' }}>
            <span className="wf-num">{i + 1}</span>
            <div style={{ marginTop: 10 }}><Heading size="small">{p.t}</Heading></div>
            <div style={{ marginTop: 6 }}><Sub size={14}>{p.d}</Sub></div>
            {i < arr.length - 1 && <Anno style={{ right: -14, top: '50%' }}>→</Anno>}
          </Box>
        ))}
      </div>
    </div>

    {/* FAQ */}
    <div className="wf-section dark">
      <Label>FAQ · objection handling · NO PRICING</Label>
      <Heading size="big">Questions organizations ask.</Heading>
      <div style={{ height: 18 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { q: 'Is it really our brand?', a: 'Yes. Coaches and athletes see your organization throughout — your logo, colors, and domain. CSE stays behind the scenes.', open: true },
          { q: 'Who builds and maintains it?', a: "We do. You don't need a tech team or a curriculum team." },
          { q: 'How long until we launch?', a: "A organization instance can be stood up and branded quickly; timeline depends on how much localization you want. We'll map it in the demo." },
          { q: 'Can we adapt the content to our requirements?', a: "Yes. The curriculum is built to be adapted to your organization’s levels, language, and rules." },
          { q: 'What does it run on?', a: 'A managed platform we host. You get the program; we handle the infrastructure.' },
        ].map((f, i) => (
          <div key={f.q} style={{ borderBottom: `1.2px dashed ${INK}`, paddingBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 14 }}>
              <Heading size="small">{f.q}</Heading>
              <span className="wf-cap" style={{ fontSize: 18, color: RED }}>{f.open ? '−' : '＋'}</span>
            </div>
            {f.open && <div style={{ marginTop: 8 }}><Sub size={15} max={840}>{f.a}</Sub></div>}
          </div>
        ))}
      </div>
      <div className="wf-note" style={{ marginTop: 14 }}>note: pricing answered only in sales conversations — not on the public site.</div>
    </div>

    <CTABand />
    <Footer />
  </div>
);

// Reusable: track section (coach OR athlete) — same layout, different data
const TrackSection = ({ trackLabel, headline, anchor, levels, askNote }) => (
  <div className="wf-section" id={anchor}>
    <Label>{trackLabel} · track section · anchor #{anchor}</Label>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
      <span className="wf-chip solid">{trackLabel}</span>
      <div className="wf-note ink" style={{ fontWeight: 700, fontSize: 26 }}>{headline}</div>
    </div>

    {/* Ladder */}
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 70, marginTop: 8, marginBottom: 18 }}>
      {levels.map((s, i) => (
        <div key={s.t} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ width: '100%', height: 24 + (i / (levels.length - 1)) * 46, background: i === levels.length - 1 ? RED : INK, opacity: i === levels.length - 1 ? 1 : 0.4 + i * 0.15, borderRadius: '3px 3px 0 0' }} />
          <div className="wf-cap">{s.t}</div>
        </div>
      ))}
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {levels.map((p, i) => (
        <Box key={p.t} className={i === levels.length - 1 ? 'tinted' : ''}>
          <div className="wf-row split-3-7" style={{ alignItems: 'center' }}>
            {p.photo
              ? <Photo src={p.photo} alt={p.t} h={110} />
              : <Img h={100} label={`${p.t} photo`} tinted={i === levels.length - 1} />}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <div className="wf-note ink" style={{ fontWeight: 700, fontSize: 20, color: i === levels.length - 1 ? '#fff' : INK }}>{p.t}</div>
                <span className={`wf-chip ${i === levels.length - 1 ? 'solid' : ''}`} style={i === levels.length - 1 ? null : { borderColor: RED, color: RED }}>{p.s}</span>
              </div>
              <div className="wf-cap" style={{ marginTop: 6, color: i === levels.length - 1 ? '#cfd4da' : MUTE }}>{p.d}</div>
            </div>
          </div>
        </Box>
      ))}
    </div>

    {askNote && <div className="wf-note" style={{ marginTop: 10 }}>{askNote}</div>}
  </div>
);

const COACH_LEVELS = [
  { t: 'Ring Corner Certification', s: 'Entry credential', d: 'Qualifies coaches to corner athletes at sanctioned events. The first step in the coaching education pathway.', photo: PHOTOS.coachKids },
  { t: 'Bronze', s: 'Basic instructor / coach', d: 'For coaches developing athletes for competition or recreation.', photo: PHOTOS.karateWinner },
  { t: 'Silver', s: 'National level', d: 'For coaches preparing athletes for national competition.', photo: PHOTOS.sparAction },
  { t: 'Gold', s: 'International / world-class', d: 'For coaches preparing athletes for world-class competition.', photo: PHOTOS.podium },
];

// Athlete training stages (from athlete-training-page brief)
const ATHLETE_LEVELS = [
  { t: 'Fundamentals', s: 'Entry', d: 'Technique, conditioning, and functional movement.', photo: PHOTOS.athletePortrait },
  { t: 'Competition Prep', s: 'Club / local', d: 'Sparring, tactics, and ring readiness.', photo: PHOTOS.boxingRing },
  { t: 'National-level Prep', s: 'National', d: 'Structured preparation for national competition.', photo: PHOTOS.worldWinner },
  { t: 'Elite / International', s: 'World-class', d: 'World-class and Olympic-track development.', photo: PHOTOS.silverMedalist },
];

const PagePrograms = () => (
  <div className="wf-chrome">
    <Header active="Programs" />

    {/* HERO */}
    <div className="wf-section dark" style={{ paddingTop: 56, paddingBottom: 56 }}>
      <Label>Hero · coach certification</Label>
      <div className="wf-row split-7-3" style={{ alignItems: 'center', gap: 32 }}>
        <div>
          <div className="wf-chip red" style={{ marginBottom: 12 }}>For Coaches</div>
          <Heading size="huge">A complete coach certification pathway.</Heading>
          <div style={{ height: 16 }} />
          <Sub size={17} max={560}>
            From cornering an athlete safely to preparing world-class competitors — one progressive, recognized pathway, delivered under your brand.
          </Sub>
          <div style={{ marginTop: 18 }}>
            <Btn variant="ghost">Athlete development pathway →</Btn>
          </div>
        </div>
        <Photo src={PHOTOS.coachKids} alt="Coach with young competitors" h={320} />
      </div>
    </div>

    <Divider />

    <TrackSection
      trackLabel="The pathway"
      anchor="coaches"
      headline="Four progressive levels."
      levels={COACH_LEVELS}
    />

    {/* Adaptability */}
    <div className="wf-section dark">
      <Label>Adaptability note</Label>
      <div className="wf-row split-3-7" style={{ gap: 32, alignItems: 'flex-start' }}>
        <Heading size="med">Adapt it to your organization.</Heading>
        <Sub size={16} max={780}>
          Level names and requirements are adaptable — your organization can map them to your own structure and rules. The curriculum is updated regularly so coaches always train against current standards.
        </Sub>
      </div>
    </div>

    {/* Cross-link to athlete page */}
    <div className="wf-section">
      <Label>Cross-link · the other half of the system</Label>
      <Box className="filled">
        <div className="wf-row split-7-3" style={{ alignItems: 'center', gap: 24 }}>
          <div>
            <div className="wf-chip red" style={{ marginBottom: 8 }}>Pairs with</div>
            <Heading size="big">Athlete Training</Heading>
            <div style={{ height: 6 }} />
            <Sub size={15}>CSE-certified coaches deliver the athlete pathway. One connected system.</Sub>
          </div>
          <div style={{ textAlign: 'right' }}><Btn variant="ghost">See athlete pathway →</Btn></div>
        </div>
      </Box>
    </div>

    <CTABand />
    <Footer />
  </div>
);

// ---- ATHLETE TRAINING PAGE (new, per athlete-training-page brief) --------
const PageAthletes = () => (
  <div className="wf-chrome">
    <Header active="Athlete Training" />

    {/* HERO */}
    <div className="wf-section dark" style={{ paddingTop: 56, paddingBottom: 56 }}>
      <Label>Hero · athlete development angle</Label>
      <div className="wf-row split-7-3" style={{ alignItems: 'center', gap: 32 }}>
        <div>
          <div className="wf-chip red" style={{ marginBottom: 12 }}>For Athletes</div>
          <Heading size="mega">A complete development pathway for your athletes — not just your coaches.</Heading>
          <div style={{ height: 16 }} />
          <Sub size={17} max={560}>
            A structured training and competition-prep curriculum that takes your athletes from fundamentals to world-class readiness — branded as your organization’s own.
          </Sub>
          <div style={{ marginTop: 20 }}><Btn>Book a Demo →</Btn></div>
        </div>
        <Photo src={PHOTOS.flyingKick} alt="Athletes mid-air kick exchange" h={420} />
      </div>
    </div>

    <Divider />

    {/* THE GAP */}
    <div className="wf-section">
      <Label>The gap · framing</Label>
      <div className="wf-row split-3-7" style={{ gap: 36, alignItems: 'flex-start' }}>
        <div>
          <div className="wf-chip" style={{ marginBottom: 10 }}>The gap</div>
          <Heading size="big">Organizations invest in coaches. Athlete development is often left to chance.</Heading>
        </div>
        <div>
          <Sub size={17} max={780}>
            Organizations invest heavily in coaches, but athlete development is often left to chance — inconsistent gym by gym. A standardized pathway raises your whole talent pool and supports safer, better-prepared competitors across every club under your banner.
          </Sub>
          <div className="wf-row c3" style={{ marginTop: 22, gap: 14 }}>
            {[
              { t: 'Raises the talent pool', d: 'A standard every club trains against.' },
              { t: 'Safer competitors', d: 'Consistent prep before sanctioned events.' },
              { t: 'Consistent prep', d: 'One program across your whole organization.' },
            ].map(b => (
              <Box key={b.t}>
                <div style={{ width: 22, height: 22, background: RED, clipPath: 'polygon(0 100%, 35% 0, 100% 0, 65% 100%)', marginBottom: 8 }} />
                <Heading size="small">{b.t}</Heading>
                <div style={{ height: 4 }} />
                <Sub size={13}>{b.d}</Sub>
              </Box>
            ))}
          </div>
        </div>
      </div>
    </div>

    <Divider />

    {/* THE PATHWAY */}
    <TrackSection
      trackLabel="The pathway"
      anchor="pathway"
      headline="Four progressive stages."
      levels={ATHLETE_LEVELS}
    />

    <div className="wf-section tight">
      <Sub size={14} color="#9aa0a6">Stage names are adaptable — organizations can map them to their own levels.</Sub>
    </div>

    <Divider />

    {/* AREAS COVERED */}
    <div className="wf-section">
      <Label>Areas covered · what the pathway develops</Label>
      <Eyebrow>What the pathway develops</Eyebrow>
      <Heading size="big">Built across the areas that decide competitive outcomes.</Heading>
      <div style={{ height: 14 }} />
      <Sub size={17} max={820}>
        The athlete curriculum builds across the areas that decide competitive outcomes: technical skill development, functional and sport-specific conditioning, sequential skill progression, sparring and tactical readiness, and structured competition preparation.
      </Sub>
      <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {[
          'Technical skill development',
          'Functional & sport-specific conditioning',
          'Sequential skill progression',
          'Sparring & tactical readiness',
          'Structured competition prep',
        ].map(t => (
          <span key={t} className="wf-chip red" style={{ padding: '6px 14px', fontSize: 15 }}>{t}</span>
        ))}
      </div>
    </div>

    <Divider />

    {/* DELIVERED UNDER YOUR BRAND */}
    <div className="wf-section dark">
      <Label>Delivered under your brand · white-label</Label>
      <div className="wf-row split-7-3" style={{ alignItems: 'center', gap: 32 }}>
        <div>
          <div className="wf-chip red" style={{ marginBottom: 10 }}>White-label</div>
          <Heading size="big">The athlete program runs inside your organization’s branded platform — maintained and updated by CSE, experienced as your own.</Heading>
          <div style={{ marginTop: 14 }}><Btn variant="ghost">How the white-label works →</Btn></div>
        </div>
        <Photo src={PHOTOS.fighterVictory} alt="Athlete moment" h={240} />
      </div>
    </div>

    <Divider />

    {/* CROSS-LINK */}
    <div className="wf-section">
      <Label>Ties to the coaching program · one connected system</Label>
      <div className="wf-row c2" style={{ gap: 18 }}>
        <Box className="filled">
          <div className="wf-chip" style={{ marginBottom: 8 }}>Programs</div>
          <Heading size="small">Coach Certification</Heading>
          <Sub size={14}>Ring Corner → Gold. The coaches who deliver this pathway.</Sub>
          <div style={{ marginTop: 10 }}><Btn variant="ghost">See coach pathway →</Btn></div>
        </Box>
        <Box className="filled">
          <div className="wf-chip" style={{ marginBottom: 8 }}>How It Works</div>
          <Heading size="small">The white-label model</Heading>
          <Sub size={14}>Brand it · launch · ongoing updates.</Sub>
          <div style={{ marginTop: 10 }}><Btn variant="ghost">How it works →</Btn></div>
        </Box>
      </div>
    </div>

    <CTABand />
    <Footer />
  </div>
);

const PageCaseStudy = () => (
  <div className="wf-chrome">
    <Header active="Case study" />

    {/* HERO */}
    <div className="wf-section dark" style={{ paddingTop: 56, paddingBottom: 56 }}>
      <Label>Hero · case-study masthead</Label>
      <div className="wf-row split-7-3" style={{ alignItems: 'center', gap: 32 }}>
        <div>
          <div className="wf-chip red" style={{ marginBottom: 12 }}>Case study</div>
          <Heading size="mega">The certification program behind USA Kickboxing.</Heading>
          <div style={{ height: 18 }} />
          <Sub size={17} max={560}>
            How CSE built and delivered a recognized coaching education program for a national organization — the proof that the model works.
          </Sub>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <LogoTile src={PHOTOS.uskLogo} alt="USA Kickboxing" h={120} pad={14} />
          <Box>
            <div className="wf-cap" style={{ marginBottom: 4 }}>At a glance</div>
            <Sub size={14}><strong>18 coaches certified</strong> in USA Kickboxing’s first national certification class. Delivered by CSE across five structured stages.</Sub>
          </Box>
        </div>
      </div>
    </div>

    <Divider />

    {/* NEED / DELIVERED / RESULT */}
    <div className="wf-section">
      <Label>Need → Delivered → Result · 3-act structure</Label>
      <div className="wf-row c3">
        <Box>
          <div className="wf-chip red" style={{ marginBottom: 8 }}>Act 1 · The need</div>
          <Heading size="med">A credible coaching standard.</Heading>
          <div style={{ height: 8 }} />
          <Sub size={14}>
            USA Kickboxing needed standardized coaching education — a credible, consistent way to certify the coaches and ring corners responsible for athlete safety at sanctioned events. Building that program in-house would mean curriculum development, assessment design, and technology most organizations don't have the time or resources to take on.
          </Sub>
        </Box>
        <Box>
          <div className="wf-chip red" style={{ marginBottom: 8 }}>Act 2 · What CSE delivered</div>
          <Heading size="med">Ring Corner through Gold.</Heading>
          <div style={{ height: 8 }} />
          <Sub size={14}>
            A complete coaching education program spanning Ring Corner certification through Bronze, Silver, and Gold levels — with assessments, knowledge requirements, and a clear progression pathway. The Ring Corner credential qualifies coaches to corner athletes for one year at sanctioned events and serves as the entry point into the coaching education program. Curriculum is kept current with regular updates.
          </Sub>
        </Box>
        <Box className="tinted">
          <div className="wf-chip solid" style={{ marginBottom: 8 }}>Act 3 · The result</div>
          <Heading size="med" color="#fff">Live, recognized, in active use.</Heading>
          <div style={{ height: 8 }} />
          <Sub size={14} color="#cfd4da">
            A live, recognized certification program in active use at the national level.
          </Sub>
          <div style={{ marginTop: 10 }}>
            <Sub size={13} color="#cfd4da"><strong style={{ color: '#fff' }}>18 coaches</strong> in the first national certification class — built and delivered across five structured stages.</Sub>
          </div>
        </Box>
      </div>
    </div>

    {/* Pull quote */}
    <div className="wf-section dark" style={{ textAlign: 'center', padding: '48px 96px' }}>
      <Label>Pull quote · optional · supply real attribution</Label>
      <div style={{ fontSize: 48, color: RED, lineHeight: 0.5, fontFamily: 'Caveat, cursive' }}>“</div>
      <Heading size="big">“An extreme honor to be one of 18 certified WAKO Team USA coaches.”</Heading>
      <div style={{ marginTop: 14 }}>
        <Sub size={14} color="#9aa0a6">Tom Whitaker · Owner, Metro Krav Maga & Kickboxing · Illinois</Sub>
      </div>
    </div>

    {/* Photo strip */}
    <div className="wf-section">
      <Label>Photo strip · program in action</Label>
      <div className="wf-row c3">
        <Photo src={PHOTOS.tatamiWinner} alt="Winner on the tatami" h={200} />
        <Photo src={PHOTOS.bronzeMedalist} alt="Bronze medalist · 2024 Worlds" h={200} />
        <Photo src={PHOTOS.fighterVictory} alt="Fighter post-victory" h={200} />
      </div>
    </div>

    {/* WHY IT MATTERS */}
    <div className="wf-section dark">
      <Label>Why it matters for your organization · closer</Label>
      <div className="wf-row split-3-7" style={{ gap: 32, alignItems: 'flex-start' }}>
        <Heading size="big">Available to your organization — under your brand.</Heading>
        <Sub size={17} max={780}>
          What CSE built for USA Kickboxing is the same system available to your organization — under your brand. You skip the years of development and launch a proven program as your own.
        </Sub>
      </div>
    </div>

    <CTABand headline="Want a program like this under your organization’s brand?" />
    <Footer />
  </div>
);

const PageWhyCSE = () => (
  <div className="wf-chrome">
    <Header active="Why CSE" />

    {/* HERO */}
    <div className="wf-section dark" style={{ paddingTop: 56, paddingBottom: 56 }}>
      <Label>Hero · positioning</Label>
      <Eyebrow>Why organizations choose CSE</Eyebrow>
      <Heading size="mega">The only partner that gives you the whole stack — branded as yours.</Heading>
      <div style={{ height: 18 }} />
      <Sub size={18} max={780}>
        Most providers sell you content or software. CSE delivers both — a finished, recognized program on a platform we run for you.
      </Sub>
    </div>

    <Divider />

    {/* ADVANTAGES */}
    <div className="wf-section">
      <Label>4 advantage blocks · 2×2 grid</Label>
      <div className="wf-row c2" style={{ rowGap: 22 }}>
        {[
          { t: 'Finished, recognized curriculum', d: 'Not a template to fill in. A complete coaching and athlete pathway already proven at the national level.' },
          { t: 'First mover with proof', d: 'A live organization implementation behind us, not a pitch deck. The model is already working.' },
          { t: 'Fully managed platform', d: 'We host and maintain everything. You launch a program, not a tech project.' },
          { t: 'Built for organizations', d: 'Designed around coach credentialing, athlete safety, and the standards that recognition and sanctioning demand.' },
        ].map(p => (
          <Box key={p.t} className="filled">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, background: RED, clipPath: 'polygon(0 100%, 35% 0, 100% 0, 65% 100%)' }} />
              <Heading size="med">{p.t}</Heading>
            </div>
            <Sub size={15}>{p.d}</Sub>
          </Box>
        ))}
      </div>
    </div>

    {/* RECOGNITION LINEAGE */}
    <div className="wf-section dark">
      <Label>Recognition lineage · institutional credibility</Label>
      <Eyebrow>Built to standard</Eyebrow>
      <Heading size="big">Built to the standard that recognizes the sport.</Heading>
      <div style={{ height: 16 }} />
      <Sub size={17} max={820}>
        Kickboxing is a US Olympic & Paralympic recognized sport, governed globally by WAKO (World Association of Kickboxing Organizations) and its national member organizations. CSE's program is built to that standard — so the credential you issue carries weight.
      </Sub>
      <div className="wf-row c3" style={{ marginTop: 22 }}>
        <Box>
          <div className="wf-cap">Sport status</div>
          <Heading size="small">US Olympic & Paralympic recognized</Heading>
        </Box>
        <Box>
          <div className="wf-cap">Global body</div>
          <Heading size="small">WAKO · world governing body</Heading>
        </Box>
        <Box>
          <div className="wf-cap">CSE's standard</div>
          <Heading size="small">Built to match</Heading>
        </Box>
      </div>
    </div>

    {/* Comparison strip */}
    <div className="wf-section">
      <Label>Comparison · CSE vs build-from-scratch</Label>
      <Heading size="big">Buy vs build.</Heading>
      <div style={{ height: 16 }} />
      <div className="wf-row c2">
        <Box>
          <Heading size="small">Build it yourself</Heading>
          <div style={{ height: 8 }} />
          <Sub size={14}>Curriculum design, assessment writing, hosting, content updates — years of work, every cost on your side, no proof of recognition.</Sub>
        </Box>
        <Box className="tinted">
          <Heading size="small" color="#fff">With CSE</Heading>
          <div style={{ height: 8 }} />
          <Sub size={14} color="#cfd4da">Finished pathway. Recognized standard. Branded as yours. Hosted and maintained. Launch in a fraction of the time.</Sub>
        </Box>
      </div>
    </div>

    <CTABand />
    <Footer />
  </div>
);

const PageAbout = () => (
  <div className="wf-chrome">
    <Header active="About" />

    {/* HERO */}
    <div className="wf-section dark" style={{ paddingTop: 56, paddingBottom: 56 }}>
      <Label>Hero · who we are</Label>
      <div className="wf-row split-7-3" style={{ alignItems: 'center', gap: 32 }}>
        <div>
          <div className="wf-chip" style={{ marginBottom: 12 }}>About</div>
          <Heading size="mega">We build the programs organizations run.</Heading>
          <div style={{ height: 16 }} />
          <Sub size={18} max={560}>
            Combat Sports Education exists to give organizations a credible, recognized certification program without the years of development behind it.
          </Sub>
        </div>
        <Photo src={PHOTOS.ringBout} alt="USA Kickboxing ring action" h={320} />
      </div>
    </div>

    <Divider />

    {/* THE STORY */}
    <div className="wf-section">
      <Label>The story · credibility-led</Label>
      <div className="wf-row split-3-7" style={{ gap: 36, alignItems: 'flex-start' }}>
        <div>
          <div className="wf-chip red" style={{ marginBottom: 8 }}>Our background</div>
          <Heading size="big">Built from inside the sport.</Heading>
        </div>
        <Sub size={17} max={780}>
          Combat Sports Education built its certification curriculum from inside the sport — developed and delivered at the national level, refined through real coaching education, and kept current as standards evolve. The result is a program organizations can adopt with confidence and run as their own.
        </Sub>
      </div>
    </div>

    {/* CREDIBILITY PILLARS */}
    <div className="wf-section dark">
      <Label>Credibility pillars · 3 stats</Label>
      <div className="wf-row c3">
        {[
          { n: '3×', d: 'World Kickboxing Champion · founder' },
          { n: '18',    d: "Coaches in USA Kickboxing's first national certification class" },
          { n: '5',     d: 'Certification stages · Ring Corner → Gold' },
        ].map(p => (
          <Box key={p.d}>
            <Heading size="mega" color="#E8413A">{p.n}</Heading>
            <div style={{ height: 6 }} />
            <Sub size={14}>{p.d}</Sub>
          </Box>
        ))}
      </div>
    </div>

    {/* FOUNDER · David Bybee */}
    <div className="wf-section">
      <Label>Founder block · David Bybee</Label>
      <div className="wf-row split-3-7" style={{ gap: 32, alignItems: 'flex-start' }}>
        <div>
          <Photo
            src={PHOTOS.bybeePortrait}
            alt="David Bybee"
            h={400}
            pos="center 20%"
            style={{ aspectRatio: '3/4', height: 'auto' }}
          />
        </div>
        <div>
          <div className="wf-chip red" style={{ marginBottom: 8 }}>Founder</div>
          <Heading size="huge">David Bybee</Heading>
          <div style={{ marginTop: 6 }}>
            <Sub size={14} color="#9aa0a6">Founder, Combat Sports Education · Director of Coaches, USA Kickboxing</Sub>
          </div>
          <div style={{ marginTop: 16 }}>
            <Sub size={16}>
              David Bybee is a 3× World Kickboxing Champion with a 36-year journey in martial arts, a 6th-degree black belt in Joe Lewis Fighting Systems, and a BJJ black belt. He serves as Director of Coaches for USA Kickboxing and, in 2018, was chosen as a Team USA Olympic coach. He owns and operates American MMA.
            </Sub>
          </div>
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              '3× World Kickboxing Champion',
              'WAKO Gold & Bronze Medalist',
              'Director of Coaches · USA Kickboxing',
              'CEO · American Mixed Martial Arts',
              '6th Degree Black Belt · JLFS',
              'BJJ Black Belt · Ricardo DeLaRiva lineage',
            ].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: RED, fontFamily: 'Caveat, cursive', fontSize: 18, lineHeight: 1 }}>✕</span>
                <Sub size={14}>{t}</Sub>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* FOUNDER · Ed Bavelock */}
    <div className="wf-section dark">
      <Label>Founder block · Coach Ed Bavelock · VP of Education</Label>
      <div className="wf-row split-7-3" style={{ gap: 32, alignItems: 'flex-start' }}>
        <div>
          <div className="wf-chip red" style={{ marginBottom: 8 }}>VP of Education</div>
          <Heading size="huge">Coach Ed Bavelock</Heading>
          <div style={{ marginTop: 6 }}>
            <Sub size={14} color="#9aa0a6">Wrestling · Classic Melbourne kickboxing · Kimekai MMA, Melbourne</Sub>
          </div>
          <div style={{ marginTop: 16 }}>
            <Sub size={16}>
              Ed Bavelock of Kimekai MMA (Melbourne) has a background in wrestling and classic Melbourne kickboxing, and has coached numerous competitive combat-sports fighters.
            </Sub>
          </div>
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { t: 'Wrestling background', verified: true },
              { t: 'Classic Melbourne kickboxing', verified: true },
              { t: 'Kimekai MMA · Melbourne', verified: true },
              { t: 'Coached numerous competitive fighters', verified: true },
              { t: '35+ years coaching', verified: false },
              { t: 'Pioneer of Kickboxing / MMA / Muay Thai in Australia', verified: false },
            ].map(b => (
              <div key={b.t} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: RED, fontFamily: 'Caveat, cursive', fontSize: 18, lineHeight: 1 }}>✕</span>
                {b.verified
                  ? <Sub size={14}>{b.t}</Sub>
                  : <Sub size={14}>{b.t} <span style={{ background: '#fff2c2', color: '#8a6300', padding: '1px 6px', borderRadius: 3, fontFamily: 'Caveat, cursive', fontSize: 12, border: '1px dashed #b88a00' }}>confirm</span></Sub>}
              </div>
            ))}
          </div>
        </div>
        <div>
          <Photo
            src={PHOTOS.bavelockPortrait}
            alt="Coach Ed Bavelock"
            h={400}
            pos="center 25%"
            style={{ aspectRatio: '3/4', height: 'auto' }}
          />
        </div>
      </div>
    </div>

    <CTABand />
    <Footer />
  </div>
);

const PageBookDemo = () => (
  <div className="wf-chrome">
    <Header active="Book a Demo" />

    {/* HERO */}
    <div className="wf-section dark" style={{ paddingTop: 56, paddingBottom: 48 }}>
      <Label>Hero · conversion-focused</Label>
      <div className="wf-chip red" style={{ marginBottom: 12 }}>Book a Demo</div>
      <Heading size="mega">See the platform in your organization’s colors.</Heading>
      <div style={{ height: 16 }} />
      <Sub size={18} max={780}>
        A 30-minute walkthrough. We'll show you the certification pathway, how the white-label model works, and what it would take to launch under your brand.
      </Sub>
    </div>

    <Divider />

    {/* FORM + SIDEBAR */}
    <div className="wf-section">
      <div className="wf-row split-7-3" style={{ gap: 40 }}>
        <div>
          <Label>Demo request form · GHL endpoint</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="wf-row c2">
              <div>
                <Sub size={13} color="#9aa0a6">Full name *</Sub>
                <div className="wf-field">Full name</div>
              </div>
              <div>
                <Sub size={13} color="#9aa0a6">Your role *</Sub>
                <div className="wf-field">e.g. Director of Coaching</div>
              </div>
            </div>
            <div>
              <Sub size={13} color="#9aa0a6">Organization *</Sub>
              <div className="wf-field">Your organization or organization</div>
            </div>
            <div className="wf-row c2">
              <div>
                <Sub size={13} color="#9aa0a6">Country *</Sub>
                <div className="wf-field">Country</div>
              </div>
              <div>
                <Sub size={13} color="#9aa0a6">Email *</Sub>
                <div className="wf-field">you@organization.org</div>
              </div>
            </div>
            <div>
              <Sub size={13} color="#9aa0a6">Phone (optional)</Sub>
              <div className="wf-field">Phone</div>
            </div>
            <div>
              <Sub size={13} color="#9aa0a6">Message (optional)</Sub>
              <div className="wf-field tall">Tell us what your organization needs…</div>
            </div>
            <div style={{ marginTop: 6 }}><Btn>Request my demo →</Btn></div>
            <Sub size={13} color="#9aa0a6">
              We'll reply within one business day to schedule a time. No commitment.
            </Sub>
          </div>
        </div>

        <div>
          <Label>What happens next · reassurance</Label>
          <Box className="filled">
            <Heading size="med">What happens next.</Heading>
            <div style={{ height: 12 }} />
            {[
              { t: 'We reach out', d: 'A real person, not an autoresponder.' },
              { t: 'We walk you through it', d: 'The program, the platform, and your branding options.' },
              { t: 'We map your launch', d: "If it's a fit, we'll outline what going live looks like for your organization." },
            ].map((p, i) => (
              <div key={p.t} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <span className="wf-num" style={{ width: 30, height: 30, fontSize: 16 }}>{i + 1}</span>
                <div>
                  <Heading size="small">{p.t}</Heading>
                  <Sub size={13}>{p.d}</Sub>
                </div>
              </div>
            ))}
          </Box>
          <div style={{ height: 14 }} />
          <Box>
            <div className="wf-cap" style={{ marginBottom: 4 }}>Proof</div>
            <Sub size={14}>Trusted at the national level.</Sub>
            <div style={{ marginTop: 10 }}><Btn variant="ghost">Read the USA Kickboxing case study →</Btn></div>
          </Box>
        </div>
      </div>
    </div>

    <div className="wf-section tight">
      <Sub size={13} color="#9aa0a6">No closing CTA band on this page — the form is the conversion. Footer only.</Sub>
    </div>
    <Footer />
  </div>
);

// ---------- Legal pages (Privacy, Terms) ----------------------------------

const LegalDoc = ({ title, lastUpdated, sections }) => (
  <div className="wf-chrome">
    <Header active="" />

    <div className="wf-section">
      <Label>Legal page · simple text doc · narrow column · institutional</Label>
      <div className="wf-cap" style={{ marginBottom: 6 }}>Last updated · {lastUpdated}</div>
      <div className="wf-note ink" style={{ fontWeight: 700, fontSize: 36, lineHeight: 1.05 }}>{title}</div>
      <div style={{ marginTop: 14, maxWidth: 720 }}>
        <Lines n={3} widths={['long', 'long', 'med']} />
      </div>
    </div>

    <Divider />

    <div className="wf-section">
      <div className="wf-row split-3-7" style={{ gap: 32 }}>
        {/* TOC */}
        <div>
          <Label>Anchor TOC · sticky on scroll</Label>
          <div className="wf-cap" style={{ marginBottom: 8 }}>Contents</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sections.map((s, i) => (
              <div key={s} style={{ display: 'flex', gap: 8 }}>
                <span className="wf-cap" style={{ width: 24, color: RED }}>{String(i + 1).padStart(2, '0')}</span>
                <span className="wf-cap" style={{ color: INK }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div>
          <Label>Body · numbered sections · plain prose</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {sections.map((s, i) => (
              <div key={s}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span className="wf-cap" style={{ color: RED }}>{String(i + 1).padStart(2, '0')}</span>
                  <div className="wf-note ink" style={{ fontWeight: 700, fontSize: 18 }}>{s}</div>
                </div>
                <div style={{ marginTop: 6 }}>
                  <Lines n={4 + (i % 2)} widths={['long', 'long', 'med', 'long', 'short']} />
                </div>
              </div>
            ))}
          </div>
          <div className="wf-note" style={{ marginTop: 14 }}>copy: standard policy text — ASK if specific clauses needed (e.g. GDPR, GHL data processing).</div>
        </div>
      </div>
    </div>

    <Footer />
  </div>
);

const PagePrivacy = () => (
  <LegalDoc
    title="Privacy Policy"
    lastUpdated="—"
    sections={[
      'What we collect',
      'How we use it',
      'Where it lives (GoHighLevel)',
      'Cookies & analytics',
      'Your rights',
      'Contact',
    ]}
  />
);

const PageTerms = () => (
  <LegalDoc
    title="Terms of Use"
    lastUpdated="—"
    sections={[
      'Using this site',
      'Demo requests & sales conversations',
      'Intellectual property',
      'Disclaimers',
      'Limitation of liability',
      'Governing law',
    ]}
  />
);

// ---------- Component inventory artboards ---------------------------------

const InvHeader = () => (
  <div className="wf">
    <div style={{ padding: 16 }}>
      <Label>1 · Site header (sticky)</Label>
      <Header />
      <div className="wf-cap" style={{ marginTop: 10 }}>Logo · 6-item nav · primary CTA. Active nav item underlined red. Sticky on scroll; on scroll-down past hero, condense height.</div>
    </div>
  </div>
);
const InvFooter = () => (
  <div className="wf">
    <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Label>2 · Site footer</Label>
      <div style={{ marginTop: 6 }}><Footer /></div>
      <div className="wf-cap" style={{ marginTop: 10 }}>Dark navy ground · 3 link columns + brandmark + tagline. No newsletter, no social slop.</div>
    </div>
  </div>
);
const InvCTA = () => (
  <div className="wf">
    <div style={{ padding: 16 }}>
      <Label>3 · CTA band · repeated bottom of every page (except Demo)</Label>
      <CTABand />
      <div className="wf-cap" style={{ marginTop: 10 }}>Headline + sub + button on navy w/ red slash motif rail on the right edge.</div>
    </div>
  </div>
);
const InvHero = () => (
  <div className="wf">
    <div style={{ padding: 16 }}>
      <Label>4 · Hero block · 7:3 split, photo or mockup right</Label>
      <div className="wf-section dark" style={{ padding: 18, border: `1.5px dashed ${INK}` }}>
        <div className="wf-row split-7-3" style={{ alignItems: 'center' }}>
          <div>
            <div className="wf-chip red" style={{ marginBottom: 8 }}>Eyebrow</div>
            <Headline size="huge" lines={2} />
            <div style={{ height: 10 }} />
            <Lines n={2} widths={['long', 'med']} />
            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <Btn>Book a Demo</Btn>
              <Btn variant="ghost">Secondary</Btn>
            </div>
          </div>
          <Img h={180} label="hero image" tinted />
        </div>
      </div>
      <div className="wf-cap" style={{ marginTop: 10 }}>Variants: photo right (Home, About) · text-only w/ chip (Programs, Why) · split w/ logo card (Case study).</div>
    </div>
  </div>
);
const InvValueStrip = () => (
  <div className="wf">
    <div style={{ padding: 16 }}>
      <Label>5 · Value-prop strip · 3 columns w/ icon</Label>
      <div className="wf-row c3" style={{ marginTop: 8 }}>
        {['Branded as yours', 'Proven & recognized', 'Fully managed'].map(t => (
          <Box key={t}>
            <div style={{ width: 22, height: 22, background: RED, clipPath: 'polygon(0 100%, 35% 0, 100% 0, 65% 100%)', marginBottom: 8 }} />
            <div className="wf-note ink" style={{ fontWeight: 700 }}>{t}</div>
            <Lines n={2} widths={['long', 'med']} />
          </Box>
        ))}
      </div>
      <div className="wf-cap" style={{ marginTop: 10 }}>Red chevron mark instead of icon family — keeps style consistent w/ slash motif.</div>
    </div>
  </div>
);
const InvStepBlock = () => (
  <div className="wf">
    <div style={{ padding: 16 }}>
      <Label>6 · Step block · numbered, with optional connector arrows</Label>
      <div className="wf-row c3" style={{ marginTop: 8 }}>
        {[1, 2, 3].map(i => (
          <Box key={i} className="filled">
            <span className="wf-num">{i}</span>
            <div className="wf-note ink" style={{ fontWeight: 700, marginTop: 6 }}>Step title</div>
            <Lines n={2} widths={['long', 'med']} />
          </Box>
        ))}
      </div>
      <div className="wf-cap" style={{ marginTop: 10 }}>3-up (Home condensed) or 4-up (How It Works). Connectors only on the long version.</div>
    </div>
  </div>
);
const InvProgramCard = () => (
  <div className="wf">
    <div style={{ padding: 16 }}>
      <Label>7 · Program card · home preview + full block variant</Label>
      <div className="wf-row c2" style={{ marginTop: 8 }}>
        <Box>
          <Img h={80} label="visual" />
          <div className="wf-note ink" style={{ fontWeight: 700, marginTop: 8 }}>Silver</div>
          <div className="wf-cap">National level</div>
          <Lines n={2} widths={['long', 'short']} />
          <div className="wf-cap" style={{ marginTop: 6, color: MUTE }}>compact · home preview</div>
        </Box>
        <Box className="tinted">
          <div className="wf-row split-3-7" style={{ alignItems: 'center' }}>
            <Img h={70} label="visual" tinted />
            <div>
              <div className="wf-note" style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>Gold</div>
              <div className="wf-cap" style={{ color: '#cfd4da' }}>World-class · highlight</div>
            </div>
          </div>
          <div className="wf-cap" style={{ marginTop: 6, color: '#cfd4da' }}>full · programs page · top tier inverts</div>
        </Box>
      </div>
    </div>
  </div>
);
const InvCaseStudy = () => (
  <div className="wf">
    <div style={{ padding: 16 }}>
      <Label>8 · Case-study layout · 3-act + pull quote</Label>
      <div className="wf-row c3" style={{ marginTop: 6 }}>
        {['Need', 'Delivered', 'Result'].map((t, i) => (
          <Box key={t}><span className="wf-chip red">Act {i + 1}</span><div className="wf-note ink" style={{ fontWeight: 700, marginTop: 6 }}>{t}</div><Lines n={3} /></Box>
        ))}
      </div>
      <div className="wf-section dark" style={{ marginTop: 10, padding: 14, textAlign: 'center', border: `1.5px dashed ${INK}` }}>
        <div className="wf-note ink" style={{ fontSize: 18 }}>"Pull quote slot."</div>
      </div>
      <div className="wf-cap" style={{ marginTop: 8 }}>Need → Delivered → Result. Pull quote band between Result & photo strip.</div>
    </div>
  </div>
);
const InvDemoForm = () => (
  <div className="wf">
    <div style={{ padding: 16 }}>
      <Label>9 · Demo form · GHL-wired</Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
        <div className="wf-row c2">
          <div className="wf-field">Name</div>
          <div className="wf-field">Role</div>
        </div>
        <div className="wf-field">Organization</div>
        <div className="wf-row c2">
          <div className="wf-field">Country</div>
          <div className="wf-field">Email</div>
        </div>
        <div className="wf-field tall">Message</div>
        <div><Btn>Request a Demo →</Btn></div>
      </div>
      <div className="wf-cap" style={{ marginTop: 8 }}>6 fields. No account creation. Submit posts to GoHighLevel webhook; success state replaces the form w/ confirmation copy.</div>
    </div>
  </div>
);
const InvSlash = () => (
  <div className="wf">
    <div style={{ padding: 16 }}>
      <Label>10 · Section divider · 6 explorations</Label>
      <div className="wf-divider" style={{ marginTop: 12 }}><span>placeholder — pick a motif from explorations</span></div>
      <div className="wf-cap" style={{ marginTop: 14 }}>The original red/navy stripe is out. See the "Divider motif · explorations" section for 6 directions: hairline + chevron, single saber slash, angled cut, photo strip, editorial section-number, and offset block.</div>
    </div>
  </div>
);

// ---------- Divider explorations -----------------------------------------

const ExplorationFrame = ({ children, label, note }) => (
  <div className="wf">
    <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Label>{label}</Label>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginTop: 14, marginBottom: 8 }}>
        {/* mini section above */}
        <div style={{ background: INK, color: '#fff', padding: '18px 22px' }}>
          <div className="wf-note" style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>Section above</div>
          <div style={{ marginTop: 6, opacity: 0.6 }}><Lines n={1} widths={['long']} /></div>
        </div>
        {children}
        {/* mini section below */}
        <div style={{ background: PAPER, padding: '18px 22px', border: `1.2px solid ${INK}`, borderTop: 'none' }}>
          <div className="wf-note ink" style={{ fontWeight: 700, fontSize: 16 }}>Section below</div>
          <div style={{ marginTop: 6 }}><Lines n={1} widths={['long']} /></div>
        </div>
      </div>
      <div className="wf-cap">{note}</div>
    </div>
  </div>
);

// 1 · Hairline + brand chevron
const DivOptA = () => (
  <ExplorationFrame
    label="A · Hairline + brand chevron"
    note="Quietest option. Lets photography & headlines carry the energy. Closest in feel to USA Kickboxing's own page typography."
  >
    <div style={{ background: PAPER, padding: '22px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 22, right: 22, height: 1, background: 'rgba(31,42,55,0.25)' }} />
      <div style={{ width: 28, height: 28, background: RED, clipPath: 'polygon(0 100%, 35% 0, 100% 0, 65% 100%)', position: 'relative', zIndex: 1 }} />
    </div>
  </ExplorationFrame>
);

// 2 · Single saber slash
const DivOptB = () => (
  <ExplorationFrame
    label="B · Single saber slash"
    note="One bold red diagonal, not repeated. Carries the 'athletic' energy of the brochure without becoming wallpaper."
  >
    <div style={{ position: 'relative', height: 48, background: INK, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: -10, top: -8, width: '120%', height: 4, background: RED, transform: 'rotate(-3.5deg)', transformOrigin: 'left center' }} />
    </div>
  </ExplorationFrame>
);

// 3 · Angled cut
const DivOptC = () => (
  <ExplorationFrame
    label="C · Angled section cut"
    note="No divider element — the section's bottom edge is the divider. Diagonal cut into the next color. Modern, confident, no decoration."
  >
    <div style={{ background: INK, height: 38, clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 100%)' }} />
  </ExplorationFrame>
);

// 4 · Photo strip
const DivOptD = () => (
  <ExplorationFrame
    label="D · Thin photo band"
    note="A 60px slice of action photography between sections. Lets the imagery do the divider work. Best on long pages w/ heavy text."
  >
    <Img h={60} label="action photo strip · ring corner / training" tinted />
  </ExplorationFrame>
);

// 5 · Editorial section-number
const DivOptE = () => (
  <ExplorationFrame
    label="E · Editorial section-number"
    note="'01 / How it works' with hairlines. Most institutional / organization-board feeling. Doubles as anchor labels."
  >
    <div style={{ background: PAPER, padding: '22px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ flex: '0 0 auto', borderTop: `2px solid ${RED}`, borderBottom: `2px solid ${RED}`, padding: '4px 10px' }}>
        <div className="wf-note ink" style={{ fontWeight: 700, fontSize: 14, color: RED, letterSpacing: 1 }}>02</div>
      </div>
      <div className="wf-cap" style={{ color: INK, fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 }}>How It Works</div>
      <div style={{ flex: 1, height: 1, background: 'rgba(31,42,55,0.25)' }} />
    </div>
  </ExplorationFrame>
);

// 6 · Offset block
const DivOptF = () => (
  <ExplorationFrame
    label="F · Offset block"
    note="Navy bar w/ a small red square offset to one side. Quiet modernist motif — doesn't compete with photos. Can flip side per section for rhythm."
  >
    <div style={{ position: 'relative', height: 16, background: INK }}>
      <div style={{ position: 'absolute', left: '12%', top: -4, width: 22, height: 22, background: RED }} />
    </div>
  </ExplorationFrame>
);
const InvFAQ = () => (
  <div className="wf">
    <div style={{ padding: 16 }}>
      <Label>11 · FAQ accordion · lives on How It Works</Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
        {['Is it really our brand?', 'Who maintains the platform?', 'How long to launch?', 'Can we adapt content?'].map(q => (
          <div key={q} style={{ borderBottom: `1.2px dashed ${INK}`, paddingBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <div className="wf-note ink" style={{ fontWeight: 700 }}>{q}</div><span className="wf-cap">＋</span>
          </div>
        ))}
      </div>
      <div className="wf-cap" style={{ marginTop: 10 }}>Single-open accordion. Pricing questions intentionally absent.</div>
    </div>
  </div>
);
const InvRecognition = () => (
  <div className="wf">
    <div style={{ padding: 16 }}>
      <Label>12 · Recognition lineage block · Why CSE</Label>
      <div className="wf-row c3" style={{ marginTop: 6 }}>
        <Box><div className="wf-cap">Sport status</div><div className="wf-note ink" style={{ fontSize: 16, marginTop: 4 }}>US Olympic & Paralympic recognized</div></Box>
        <Box><div className="wf-cap">Global body</div><div className="wf-note ink" style={{ fontSize: 16, marginTop: 4 }}>WAKO · world governing body</div></Box>
        <Box><div className="wf-cap">CSE's standard</div><div className="wf-note ink" style={{ fontSize: 16, marginTop: 4 }}>Built to match</div></Box>
      </div>
      <div className="wf-cap" style={{ marginTop: 10 }}>3-tile credibility chain — establishes institutional standard without name-dropping.</div>
    </div>
  </div>
);
const InvLogoProof = () => (
  <div className="wf">
    <div style={{ padding: 16 }}>
      <Label>13 · Logo / proof tile · for Home, Case Study masthead</Label>
      <div className="wf-row split-3-7" style={{ alignItems: 'center', marginTop: 8 }}>
        <div className="wf-logopill" style={{ height: 64 }}>USA Kickboxing</div>
        <div>
          <div className="wf-note ink" style={{ fontSize: 18 }}>"A live, recognized program."</div>
          <div className="wf-cap">Read the case study →</div>
        </div>
      </div>
      <div className="wf-cap" style={{ marginTop: 10 }}>Until more organizations sign, this stays a single-logo tile, not a logo cloud. Honesty &gt; volume.</div>
    </div>
  </div>
);
const InvButtons = () => (
  <div className="wf">
    <div style={{ padding: 16 }}>
      <Label>14 · Button system</Label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6, alignItems: 'center' }}>
        <Btn>Book a Demo →</Btn>
        <Btn variant="ghost">Secondary</Btn>
        <span className="wf-chip">Eyebrow chip</span>
        <span className="wf-chip red">Eyebrow · red</span>
        <span className="wf-chip solid">Solid chip</span>
      </div>
      <div className="wf-cap" style={{ marginTop: 12 }}>Primary = red · used for the single primary CTA only. Ghost = outlined navy. Chips for eyebrows + tags.</div>
    </div>
  </div>
);

// ---------- Compose into the design canvas --------------------------------

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "divider": "C",
  "fidelity": "sketch",
  "annotated": true,
  "photo": "duotone"
}/*EDITMODE-END*/;

const DIVIDER_LABELS = {
  placeholder: 'Placeholder',
  A: 'A · Hairline + chevron',
  B: 'B · Saber slash',
  C: 'C · Angled cut',
  D: 'D · Photo band',
  E: 'E · Editorial number',
  F: 'F · Offset block',
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const modeClass = `${t.fidelity === 'crisp' ? 'fid-crisp' : t.fidelity === 'block' ? 'fid-block' : ''} ${t.annotated ? '' : 'ann-clean'}`.trim();

  return (
    <TweakCtx.Provider value={{ divider: t.divider, fidelity: t.fidelity, annotated: t.annotated, photo: t.photo }}>
      <style dangerouslySetInnerHTML={{ __html: wfCss }} />
      <div className={modeClass} style={{ width: '100%', height: '100%' }}>
        <DesignCanvas projectName="CSE Marketing Site · Wireframes">
          <DCSection
            id="dividers"
            title="Divider motif · explorations"
            subtitle="Six directions to replace the original stripe. Use the Tweaks panel to apply any of these across all 10 pages."
          >
            <DCArtboard id="d-a" label="A · Hairline + chevron" width={760} height={360}><DivOptA /></DCArtboard>
            <DCArtboard id="d-b" label="B · Saber slash" width={760} height={360}><DivOptB /></DCArtboard>
            <DCArtboard id="d-c" label="C · Angled cut" width={760} height={360}><DivOptC /></DCArtboard>
            <DCArtboard id="d-d" label="D · Photo band" width={760} height={360}><DivOptD /></DCArtboard>
            <DCArtboard id="d-e" label="E · Editorial number" width={760} height={360}><DivOptE /></DCArtboard>
            <DCArtboard id="d-f" label="F · Offset block" width={760} height={360}><DivOptF /></DCArtboard>
          </DCSection>

          <DCSection
            id="pages"
            title="Site wireframes · 10 pages"
            subtitle="Marketing pages + legal. Click any board to focus."
          >
            <DCArtboard id="home" label="1 · Home" width={1280} height={2900}><PageHome /></DCArtboard>
            <DCArtboard id="how" label="2 · How It Works" width={1280} height={2200}><PageHowItWorks /></DCArtboard>
            <DCArtboard id="programs" label="3 · Programs · Coach Certification" width={1280} height={2500}><PagePrograms /></DCArtboard>
            <DCArtboard id="athletes" label="4 · Athlete Training (new)" width={1280} height={3000}><PageAthletes /></DCArtboard>
            <DCArtboard id="case" label="5 · Case Study · USA Kickboxing" width={1280} height={2200}><PageCaseStudy /></DCArtboard>
            <DCArtboard id="why" label="6 · Why CSE" width={1280} height={2200}><PageWhyCSE /></DCArtboard>
            <DCArtboard id="about" label="7 · About · Bybee + Bavelock" width={1280} height={2700}><PageAbout /></DCArtboard>
            <DCArtboard id="demo" label="8 · Book a Demo" width={1280} height={1800}><PageBookDemo /></DCArtboard>
            <DCArtboard id="privacy" label="9 · Privacy" width={1280} height={1500}><PagePrivacy /></DCArtboard>
            <DCArtboard id="terms" label="10 · Terms" width={1280} height={1500}><PageTerms /></DCArtboard>
          </DCSection>

          <DCSection
            id="components"
            title="Component inventory"
            subtitle="Reusable parts the build will need"
          >
            <DCArtboard id="c-header" label="Site header (w/ Login link)" width={900} height={220}><InvHeader /></DCArtboard>
            <DCArtboard id="c-footer" label="Site footer (w/ Legal)" width={900} height={280}><InvFooter /></DCArtboard>
            <DCArtboard id="c-cta" label="CTA band" width={900} height={220}><InvCTA /></DCArtboard>
            <DCArtboard id="c-hero" label="Hero block" width={900} height={360}><InvHero /></DCArtboard>
            <DCArtboard id="c-value" label="Value-prop strip" width={900} height={280}><InvValueStrip /></DCArtboard>
            <DCArtboard id="c-step" label="Step block" width={900} height={280}><InvStepBlock /></DCArtboard>
            <DCArtboard id="c-program" label="Program card" width={900} height={300}><InvProgramCard /></DCArtboard>
            <DCArtboard id="c-case" label="Case-study layout" width={900} height={340}><InvCaseStudy /></DCArtboard>
            <DCArtboard id="c-form" label="Demo form" width={900} height={400}><InvDemoForm /></DCArtboard>
            <DCArtboard id="c-slash" label="Section divider" width={900} height={220}><InvSlash /></DCArtboard>
            <DCArtboard id="c-faq" label="FAQ accordion" width={900} height={300}><InvFAQ /></DCArtboard>
            <DCArtboard id="c-recog" label="Recognition lineage" width={900} height={240}><InvRecognition /></DCArtboard>
            <DCArtboard id="c-logo" label="Logo / proof tile" width={900} height={240}><InvLogoProof /></DCArtboard>
            <DCArtboard id="c-btn" label="Button system" width={900} height={220}><InvButtons /></DCArtboard>
          </DCSection>
        </DesignCanvas>

        <TweaksPanel title="Tweaks">
          <TweakSection label="Divider motif" />
          <TweakSelect
            label="Across all pages"
            value={t.divider}
            options={Object.keys(DIVIDER_LABELS).map(k => ({ value: k, label: DIVIDER_LABELS[k] }))}
            onChange={(v) => setTweak('divider', v)}
          />

          <TweakSection label="Fidelity" />
          <TweakRadio
            label="Wireframe style"
            value={t.fidelity}
            options={['sketch', 'crisp', 'block']}
            onChange={(v) => setTweak('fidelity', v)}
          />

          <TweakSection label="Annotation" />
          <TweakToggle
            label="Show margin notes"
            value={t.annotated}
            onChange={(v) => setTweak('annotated', v)}
          />

          <TweakSection label="Photo treatment" />
          <TweakRadio
            label="Look"
            value={t.photo}
            options={['duotone', 'natural', 'mono']}
            onChange={(v) => setTweak('photo', v)}
          />
        </TweaksPanel>
      </div>
    </TweakCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
