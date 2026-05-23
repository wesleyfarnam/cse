/* global React */
// site-saas.jsx — CSE marketing site, SaaS look & feel (v2).
// Same content as wireframes.jsx, fundamentally different visual treatment.

const { useState, useEffect } = React;

// ─── TOKENS ────────────────────────────────────────────────────────────────
const T = {
  ink: '#0E1726',
  ink2: '#1F2A37',
  paper: '#FFFFFF',
  soft: '#F5F7FA',
  softer: '#FAFBFC',
  border: '#E5E9EF',
  text: '#0E1726',
  muted: '#5E6B7A',
  hint: '#8893A3',
  red: '#E8413A',
  redDark: '#C3322B',
  navyAccent: '#2A3A52',
  blue: '#1F6FEB',
  blueDark: '#1556C7',
};

const PHOTOS = {
  bybeePortrait: 'https://i0.wp.com/wakousa.org/wp-content/uploads/2024/01/3-3.png?fit=600%2C900&ssl=1',
  bavelockPortrait: 'https://glsports.co.uk/wp-content/uploads/sites/943/2024/11/0-2.jpg',
  coachesConferring: 'assets/photo-coaches-conferring.jpg',
  ringBout: 'assets/photo-ring-bout.jpg',
  tatamiWinner: 'assets/photo-tatami-winner.jpg',
  silverMedalist: 'assets/photo-silver-medalist.jpg',
  karateWinner: 'assets/photo-karate-winner.jpg',
  bronzeMedalist: 'assets/photo-bronze-medalist.jpg',
  worldWinner: 'assets/photo-world-winner.jpg',
  boxingRing: 'assets/photo-boxing-ring.jpg',
  flyingKick: 'assets/photo-flying-kick.jpg',
  athletePortrait: 'assets/photo-athlete-portrait.jpg',
  coachKids: 'assets/photo-coach-kids.jpg',
  podium: 'assets/photo-podium.jpg',
  sparKick: 'assets/photo-spar-kick.jpg',
  sparAction: 'assets/photo-spar-action.jpg',
  fighterVictory: 'assets/photo-fighter-victory.jpg',
  uskLogo: 'https://i0.wp.com/wakousa.org/wp-content/uploads/2024/01/USA-Kickboxing-Logo-PMS.png?fit=300%2C217&ssl=1',
};

// ─── GLOBAL STYLES ─────────────────────────────────────────────────────────
const saasCss = `
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: ${T.paper}; color: ${T.text}; font-family: 'Inter', system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
img { max-width: 100%; display: block; }
a { color: inherit; text-decoration: none; }

.s-app { width: 100%; min-height: 100vh; }
.s-container { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
.s-section { padding: 96px 0; }
.s-section.tight { padding: 64px 0; }
.s-section.dark { background: ${T.ink}; color: #fff; }
.s-section.soft { background: ${T.soft}; }

/* TYPE */
.s-eyebrow { font-size: 13px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.red}; margin: 0 0 16px; }
.s-eyebrow.muted { color: ${T.muted}; }
.s-eyebrow.light { color: rgba(255,255,255,0.7); }
.s-h1 { font-size: clamp(40px, 5vw, 64px); line-height: 1.04; letter-spacing: -0.02em; font-weight: 800; margin: 0; }
.s-h2 { font-size: clamp(32px, 3.6vw, 48px); line-height: 1.08; letter-spacing: -0.02em; font-weight: 800; margin: 0; }
.s-h3 { font-size: 24px; line-height: 1.25; letter-spacing: -0.01em; font-weight: 700; margin: 0; }
.s-h4 { font-size: 18px; line-height: 1.3; font-weight: 600; margin: 0; }
.s-lede { font-size: 20px; line-height: 1.55; color: ${T.muted}; margin: 0; max-width: 640px; }
.s-body { font-size: 16px; line-height: 1.6; color: ${T.muted}; margin: 0; }
.s-tiny { font-size: 13px; line-height: 1.5; color: ${T.hint}; margin: 0; }
.s-section.dark .s-lede, .s-section.dark .s-body { color: rgba(255,255,255,0.78); }
.s-section.dark .s-tiny { color: rgba(255,255,255,0.55); }

/* PILL / CHIP */
.s-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; background: rgba(232,65,58,0.08); color: ${T.red}; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; border: 1px solid rgba(232,65,58,0.18); }
.s-pill.dark { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); border-color: rgba(255,255,255,0.15); }
.s-pill.gray { background: ${T.soft}; color: ${T.muted}; border-color: ${T.border}; }

/* BUTTONS */
.s-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border-radius: 10px; font-size: 15px; font-weight: 600; font-family: inherit; border: 1px solid transparent; cursor: pointer; transition: all .15s ease; line-height: 1; white-space: nowrap; }
.s-btn-primary { background: ${T.red}; color: #fff; box-shadow: 0 1px 0 rgba(255,255,255,0.15) inset, 0 6px 18px rgba(232,65,58,0.28); }
.s-btn-primary:hover { background: ${T.redDark}; }
.s-btn-secondary { background: ${T.paper}; color: ${T.ink}; border-color: ${T.border}; }
.s-btn-secondary:hover { background: ${T.soft}; }
.s-btn-ghost { background: transparent; color: ${T.ink}; }
.s-btn-ghost:hover { color: ${T.red}; }
.s-section.dark .s-btn-secondary { background: rgba(255,255,255,0.06); color: #fff; border-color: rgba(255,255,255,0.18); }
.s-section.dark .s-btn-secondary:hover { background: rgba(255,255,255,0.12); }
.s-section.dark .s-btn-ghost { color: #fff; }

/* CARD */
.s-card { background: ${T.paper}; border: 1px solid ${T.border}; border-radius: 14px; padding: 28px; transition: border-color .15s, transform .15s, box-shadow .15s; }
.s-card.dark { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); }
.s-card.feature { box-shadow: 0 1px 0 rgba(15,23,38,0.04), 0 4px 16px rgba(15,23,38,0.04); }
.s-card:hover { border-color: rgba(232,65,58,0.35); }
.s-card.dark:hover { border-color: rgba(232,65,58,0.5); background: rgba(255,255,255,0.06); }

/* HEADER */
.s-header { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,0.92); backdrop-filter: blur(12px) saturate(150%); -webkit-backdrop-filter: blur(12px) saturate(150%); border-bottom: 1px solid ${T.border}; }
.s-header-inner { display: flex; align-items: center; justify-content: space-between; height: 72px; gap: 24px; }
.s-brand { display: flex; align-items: center; gap: 10px; cursor: pointer; flex: 0 0 auto; }
.s-brand img { width: 32px; height: 32px; object-fit: contain; }
.s-brand-text { display: flex; flex-direction: column; line-height: 1; white-space: nowrap; }
.s-brand-text b { font-size: 15px; font-weight: 700; color: ${T.ink}; letter-spacing: -0.01em; }
.s-brand-text span { font-size: 9.5px; color: ${T.muted}; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 3px; }
.s-nav { display: flex; align-items: center; gap: 2px; flex: 1 1 auto; justify-content: center; min-width: 0; }
.s-nav a { font-size: 13.5px; font-weight: 500; color: ${T.muted}; padding: 8px 11px; border-radius: 7px; cursor: pointer; transition: all .12s; white-space: nowrap; }
.s-nav a:hover { color: ${T.ink}; background: ${T.soft}; }
.s-nav a.active { color: ${T.ink}; }
.s-nav a.active::after { content: ''; display: block; width: 14px; height: 2px; background: ${T.red}; margin: 4px auto 0; border-radius: 2px; }
.s-header-cta { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
.s-header-cta .s-login { font-size: 13.5px; font-weight: 500; color: ${T.muted}; cursor: pointer; white-space: nowrap; padding: 8px 4px; }
.s-header-cta .s-login:hover { color: ${T.ink}; }
@media (max-width: 1180px) {
  .s-nav a { padding: 8px 8px; font-size: 13px; }
  .s-brand-text span { display: none; }
}
@media (max-width: 980px) {
  .s-nav { display: none; }
}

/* FOOTER */
.s-footer { background: ${T.ink}; color: rgba(255,255,255,0.75); padding: 64px 0 32px; }
.s-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 48px; padding-bottom: 48px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.s-footer-col h6 { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.55); margin: 0 0 16px; }
.s-footer-col a { display: block; font-size: 14px; color: rgba(255,255,255,0.75); padding: 4px 0; transition: color .12s; cursor: pointer; }
.s-footer-col a:hover { color: #fff; }
.s-footer-brand p { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.6; max-width: 280px; margin: 16px 0 0; }
.s-footer-base { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; font-size: 12px; color: rgba(255,255,255,0.45); }

/* HERO */
.s-hero { padding: 80px 0 96px; position: relative; overflow: hidden; }
.s-hero-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 56px; align-items: center; }
.s-hero-art { position: relative; aspect-ratio: 4/5; border-radius: 18px; overflow: hidden; box-shadow: 0 30px 60px -20px rgba(15,23,38,0.25); }
.s-hero-art img { width: 100%; height: 100%; object-fit: cover; }
.s-hero-art::after { content: ''; position: absolute; inset: 0; background: linear-gradient(160deg, rgba(14,23,38,0) 60%, rgba(14,23,38,0.4) 100%); pointer-events: none; }
.s-hero-cta-row { display: flex; gap: 12px; margin-top: 32px; }
.s-hero-trust { display: flex; align-items: center; gap: 16px; margin-top: 48px; padding-top: 32px; border-top: 1px solid ${T.border}; max-width: 520px; }
.s-hero-trust img { height: 44px; width: auto; object-fit: contain; }
.s-hero-trust-text { font-size: 13px; color: ${T.muted}; line-height: 1.4; }
.s-hero-trust-text b { color: ${T.ink}; }

/* IMAGE TREATMENT — SaaS-clean: light contrast, no heavy duotone */
.s-photo { position: relative; border-radius: 14px; overflow: hidden; background: ${T.ink}; }
.s-photo img { width: 100%; height: 100%; object-fit: cover; filter: contrast(1.04) saturate(0.98); }

/* SECTION HEAD (centered pattern) */
.s-head { max-width: 720px; margin: 0 auto 64px; text-align: center; }
.s-head .s-lede { margin: 16px auto 0; }
.s-head.left { margin-left: 0; text-align: left; }

/* GRID PATTERNS */
.g-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.g-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.g-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.g-split { display: grid; grid-template-columns: 1fr 1.5fr; gap: 64px; align-items: start; }
.g-split-reverse { display: grid; grid-template-columns: 1.5fr 1fr; gap: 64px; align-items: center; }

/* PILLARS — editorial column treatment, NOT icon cards */
.s-pillars { display: grid; grid-template-columns: repeat(3, 1fr); gap: 56px; position: relative; padding-top: 4px; }
.s-pillars.cols-2 { grid-template-columns: repeat(2, 1fr); gap: 48px 80px; }
.s-pillars::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: rgba(15,23,38,0.08); }
.s-pillar { padding-top: 36px; position: relative; }
.s-pillar::before { content: ''; position: absolute; top: -2px; left: 0; width: 56px; height: 3px; background: ${T.red}; }
.s-pillar-num { font-size: 13px; font-weight: 700; color: ${T.red}; letter-spacing: 0.18em; font-feature-settings: 'tnum'; margin-bottom: 20px; }
.s-pillar-title { font-size: 26px; font-weight: 700; line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 14px; color: ${T.ink}; }
.s-pillar-body { font-size: 16px; color: ${T.muted}; line-height: 1.6; margin: 0; max-width: 340px; }
.s-pillar-body strong { color: ${T.ink}; font-weight: 600; }
@media (max-width: 980px) { .s-pillars { grid-template-columns: 1fr; gap: 36px; } }

/* GAP TRIO — same editorial pattern used on Athletes page */
.s-trio { display: grid; grid-template-columns: repeat(3, 1fr); gap: 36px; position: relative; padding-top: 4px; }
.s-trio::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: rgba(15,23,38,0.08); }
.s-trio-item { padding-top: 28px; position: relative; }
.s-trio-item::before { content: ''; position: absolute; top: -2px; left: 0; width: 40px; height: 2px; background: ${T.red}; }
.s-trio-item h4 { font-size: 17px; font-weight: 700; margin: 0 0 8px; color: ${T.ink}; }
.s-trio-item p { font-size: 14px; color: ${T.muted}; line-height: 1.55; margin: 0; }
@media (max-width: 980px) { .s-trio { grid-template-columns: 1fr; gap: 24px; } }

/* PROCESS — Home "How it works" condensed: track + huge numerals */
.s-process-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 56px; position: relative; padding-top: 40px; }
.s-process-steps::before { content: ''; position: absolute; top: 7px; left: 7px; right: 7px; height: 0; border-top: 2px dashed ${T.red}; opacity: 0.55; }
.s-process-step { position: relative; }
.s-process-step::before { content: ''; position: absolute; top: -40px; left: 0; width: 14px; height: 14px; border-radius: 50%; background: ${T.red}; box-shadow: 0 0 0 6px #fff, 0 0 0 7px rgba(232,65,58,0.18); }
.s-process-num { font-size: 88px; font-weight: 800; color: ${T.red}; line-height: 0.88; letter-spacing: -0.05em; margin: 0 0 18px; font-feature-settings: 'tnum'; font-variant-numeric: tabular-nums; }
.s-process-title { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 12px; line-height: 1.12; color: ${T.ink}; }
.s-process-body { font-size: 16px; color: ${T.muted}; line-height: 1.6; margin: 0; max-width: 320px; }
.s-process-arrow { position: absolute; top: 26px; right: -28px; font-size: 28px; color: ${T.red}; font-weight: 300; line-height: 1; opacity: 0.5; }
@media (max-width: 980px) {
  .s-process-steps { grid-template-columns: 1fr; gap: 40px; padding-top: 0; }
  .s-process-steps::before, .s-process-step::before, .s-process-arrow { display: none; }
  .s-process-num { font-size: 64px; }
}

/* PATHWAY LEVEL */
.s-level { display: flex; gap: 24px; align-items: center; padding: 24px; border-radius: 16px; background: ${T.softer}; border: 1px solid ${T.border}; margin-bottom: 14px; transition: border-color .15s; }
.s-level:hover { border-color: rgba(232,65,58,0.3); }
.s-level.top { background: ${T.ink}; color: #fff; border-color: ${T.ink}; }
.s-level-photo { width: 160px; height: 100px; flex: 0 0 160px; border-radius: 10px; overflow: hidden; background: ${T.ink}; }
.s-level-photo img { width: 100%; height: 100%; object-fit: cover; }
.s-level-body { flex: 1; }
.s-level-title-row { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 6px; }
.s-level-tag { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; background: rgba(232,65,58,0.1); color: ${T.red}; text-transform: uppercase; letter-spacing: 0.04em; }
.s-level.top .s-level-tag { background: ${T.red}; color: #fff; }
.s-level-body p { font-size: 14px; color: ${T.muted}; margin: 0; line-height: 1.5; }
.s-level.top .s-level-body p { color: rgba(255,255,255,0.78); }

/* FAQ */
.s-faq { border-top: 1px solid ${T.border}; }
.s-faq-item { border-bottom: 1px solid ${T.border}; padding: 24px 0; cursor: pointer; }
.s-faq-q { display: flex; justify-content: space-between; align-items: center; gap: 24px; }
.s-faq-q h4 { margin: 0; font-size: 18px; font-weight: 600; color: ${T.ink}; }
.s-faq-icon { width: 28px; height: 28px; border-radius: 8px; background: ${T.soft}; display: flex; align-items: center; justify-content: center; flex: 0 0 28px; font-size: 16px; color: ${T.muted}; font-weight: 400; transition: all .12s; }
.s-faq-item.open .s-faq-icon { background: ${T.red}; color: #fff; }
.s-faq-a { font-size: 15px; line-height: 1.6; color: ${T.muted}; margin-top: 12px; max-width: 800px; }

/* CTA BAND */
.s-cta { background: linear-gradient(135deg, ${T.ink} 0%, ${T.navyAccent} 100%); color: #fff; padding: 64px; border-radius: 24px; position: relative; overflow: hidden; }
.s-cta::before { content: ''; position: absolute; right: -100px; top: -100px; width: 360px; height: 360px; border-radius: 50%; background: radial-gradient(circle, rgba(232,65,58,0.35) 0%, transparent 70%); }
.s-cta-inner { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 32px; }
.s-cta h2 { font-size: 32px; line-height: 1.2; letter-spacing: -0.02em; font-weight: 700; margin: 0 0 8px; max-width: 560px; }
.s-cta p { font-size: 16px; color: rgba(255,255,255,0.7); margin: 0; max-width: 560px; }

/* STAT */
.s-stat { text-align: center; }
.s-stat-num { font-size: 56px; font-weight: 800; letter-spacing: -0.03em; color: ${T.red}; line-height: 1; }
.s-stat-label { font-size: 14px; color: ${T.muted}; margin-top: 8px; line-height: 1.5; max-width: 220px; margin-left: auto; margin-right: auto; }

/* JOURNEY — interactive auto-advancing stepper on How It Works */
.journey { margin-top: 16px; }
.journey-tabs {
  display: grid; grid-template-columns: repeat(4, 1fr);
  border-bottom: 1px solid ${T.border};
  position: relative;
  margin-bottom: 56px;
}
.journey-tab {
  padding: 22px 20px;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: background .15s;
  display: flex; gap: 14px; align-items: center;
  position: relative;
}
.journey-tab:hover { background: ${T.softer}; }
.journey-tab.active { border-bottom-color: ${T.red}; }
.journey-tab.active .journey-num { color: ${T.red}; border-color: ${T.red}; background: rgba(232,65,58,0.08); }
.journey-tab.active .journey-name { color: ${T.ink}; }
.journey-num {
  flex: 0 0 36px; width: 36px; height: 36px;
  border-radius: 50%;
  border: 1.5px solid ${T.border};
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700;
  color: ${T.muted};
  background: ${T.paper};
  transition: all .2s;
}
.journey-name { font-size: 14px; font-weight: 600; color: ${T.muted}; line-height: 1.3; transition: color .2s; }

.journey-progress {
  position: absolute; bottom: -2px; left: 0;
  height: 3px; background: ${T.red};
  border-radius: 2px;
  pointer-events: none;
}

.journey-panel {
  display: grid; grid-template-columns: 1fr 1.1fr;
  gap: 64px;
  align-items: center;
  min-height: 420px;
  animation: journeyFade .4s ease;
}
@keyframes journeyFade {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.journey-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: ${T.red}; margin-bottom: 16px; }
.journey-h { font-size: 38px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; margin: 0 0 18px; color: ${T.ink}; }
.journey-p { font-size: 18px; line-height: 1.55; color: ${T.muted}; margin: 0 0 28px; max-width: 480px; }
.journey-extras { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
.journey-extras li { display: flex; gap: 14px; font-size: 15px; color: ${T.ink}; line-height: 1.55; }
.journey-extras li::before {
  content: '\u2713'; flex: 0 0 22px;
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(232,65,58,0.1); color: ${T.red};
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
  margin-top: 1px;
}

.journey-visual {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 18px;
  overflow: hidden;
  background: ${T.ink};
  box-shadow: 0 30px 60px -20px rgba(15,23,38,0.25);
}
.journey-visual img { width: 100%; height: 100%; object-fit: cover; filter: contrast(1.04); display: block; }
.journey-visual::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(160deg, rgba(14,23,38,0) 50%, rgba(14,23,38,0.5) 100%);
}
.journey-badge {
  position: absolute; top: 20px; left: 20px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 10px 14px;
  display: flex; align-items: center; gap: 12px;
  z-index: 2;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.journey-badge-num {
  width: 36px; height: 36px;
  border-radius: 9px;
  background: ${T.red}; color: #fff;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 800;
  letter-spacing: -0.02em;
}
.journey-badge-text { display: flex; flex-direction: column; line-height: 1.2; }
.journey-badge-text small { font-size: 10px; color: ${T.muted}; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
.journey-badge-text b { font-size: 13px; color: ${T.ink}; font-weight: 700; }

.journey-controls {
  display: flex; align-items: center; gap: 14px;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid ${T.border};
  color: ${T.muted};
  font-size: 13px;
}
.journey-btn {
  display: inline-flex; align-items: center; gap: 8px;
  background: transparent; border: 1px solid ${T.border};
  border-radius: 999px; padding: 7px 16px;
  font: inherit; font-size: 13px; font-weight: 500; color: ${T.muted};
  cursor: pointer; transition: all .15s;
}
.journey-btn:hover { color: ${T.ink}; border-color: ${T.ink}; }
.journey-btn-icon { width: 8px; height: 10px; flex-shrink: 0; }

@media (max-width: 980px) {
  .journey-tabs { display: flex; overflow-x: auto; }
  .journey-tab { flex: 0 0 auto; min-width: 220px; }
  .journey-panel { grid-template-columns: 1fr; gap: 32px; }
  .journey-h { font-size: 28px; }
}

/* PATHWAY — interactive bar-chart selector + detail panel */
.pathway { margin: 24px 0 0; }
.pathway-hint {
  display: inline-flex; align-items: center; gap: 10px;
  font-size: 13px; font-weight: 500; color: ${T.muted};
  margin-bottom: 20px;
  letter-spacing: 0.01em;
}
.pathway-hint-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: ${T.red};
  animation: pathwayHintPulse 1.6s ease-in-out infinite;
}
.pathway-hint-tail { color: ${T.hint}; font-size: 12px; }
@keyframes pathwayHintPulse {
  0%, 100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(232,65,58,0.5); }
  50% { transform: scale(1.15); opacity: 0.85; box-shadow: 0 0 0 6px rgba(232,65,58,0); }
}
.pathway-bars {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  height: 220px;
  align-items: end;
  margin-bottom: 100px;
  position: relative;
}
.pathway-bars::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: 0;
  height: 1px; background: ${T.border};
}
.pathway-bar {
  position: relative;
  background: none; border: 0; padding: 0;
  cursor: pointer;
  display: flex; flex-direction: column; justify-content: flex-end;
  align-items: stretch;
  height: 100%;
  font-family: inherit;
  transition: transform .25s ease;
}
.pathway-bar:hover { transform: translateY(-4px); }
.pathway-bar-fill {
  position: relative;
  width: 100%;
  height: var(--bar-h, 40%);
  background: ${T.soft};
  border: 1.5px solid ${T.border};
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  transition: all .3s ease;
  overflow: hidden;
}
.pathway-bar:hover .pathway-bar-fill {
  background: rgba(232,65,58,0.08);
  border-color: rgba(232,65,58,0.5);
  box-shadow: 0 -8px 24px -8px rgba(232,65,58,0.25);
}
.pathway-bar.active .pathway-bar-fill {
  background: ${T.ink};
  border-color: ${T.ink};
  box-shadow: 0 -10px 30px -8px rgba(15,23,38,0.3);
}
.pathway-bar:last-child.active .pathway-bar-fill {
  background: ${T.red};
  border-color: ${T.red};
  box-shadow: 0 -10px 30px -8px rgba(232,65,58,0.5);
}
/* Pulse on the first bar until user picks one — encourages exploration */
.pathway-bar.pulse .pathway-bar-fill {
  animation: pathwayBarPulse 2.2s ease-in-out infinite;
}
@keyframes pathwayBarPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(232,65,58,0); }
  60% { box-shadow: 0 0 0 10px rgba(232,65,58,0); }
}
.pathway-bar.pulse:not(.active) .pathway-bar-fill {
  animation: pathwayBarHint 2.2s ease-in-out infinite;
}
@keyframes pathwayBarHint {
  0%, 100% { background: ${T.soft}; border-color: ${T.border}; }
  50% { background: rgba(232,65,58,0.08); border-color: rgba(232,65,58,0.4); }
}
/* Progress fill rising up inside the active bar while auto-cycling */
.pathway-bar-progress {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: rgba(232,65,58,0.35);
  border-top: 1.5px solid ${T.red};
  pointer-events: none;
}
.pathway-bar:last-child.active .pathway-bar-progress { background: rgba(255,255,255,0.22); border-top-color: rgba(255,255,255,0.9); }

.pathway-bar-num {
  position: absolute;
  top: -36px; left: 50%; transform: translateX(-50%);
  font-size: 12px; font-weight: 700; letter-spacing: 0.18em;
  color: ${T.muted};
  transition: color .2s;
}
.pathway-bar.active .pathway-bar-num { color: ${T.red}; }
.pathway-bar-name {
  position: absolute;
  top: calc(100% + 14px); left: 50%; transform: translateX(-50%);
  font-size: 14px; font-weight: 700; letter-spacing: -0.01em;
  color: ${T.muted};
  white-space: nowrap;
  transition: color .2s;
}
.pathway-bar.active .pathway-bar-name { color: ${T.ink}; }
.pathway-bar-tag {
  position: absolute;
  top: calc(100% + 36px); left: 50%; transform: translateX(-50%);
  font-size: 12px; color: ${T.hint};
  white-space: nowrap;
  transition: color .2s;
}
.pathway-bar.active .pathway-bar-tag { color: ${T.red}; font-weight: 500; }

.pathway-panel {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
  animation: journeyFade .4s ease;
  min-height: 380px;
}
.pathway-content h3 { font-size: 36px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; margin: 14px 0; color: ${T.ink}; }
.pathway-content p { font-size: 18px; line-height: 1.55; color: ${T.muted}; margin: 0 0 24px; max-width: 480px; }
.pathway-extras { list-style: none; padding: 0; margin: 0 0 8px; display: flex; flex-direction: column; gap: 12px; max-width: 480px; }
.pathway-extras li { display: flex; gap: 14px; font-size: 15px; color: ${T.ink}; line-height: 1.5; align-items: flex-start; }
.pathway-extras li::before { content: '✓'; flex: 0 0 22px; width: 22px; height: 22px; border-radius: 50%; background: rgba(232,65,58,0.1); color: ${T.red}; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; margin-top: 1px; }
.pathway-photo { aspect-ratio: 4/5; border-radius: 18px; overflow: hidden; background: ${T.ink}; box-shadow: 0 30px 60px -20px rgba(15,23,38,0.22); position: relative; }
.pathway-photo img { width: 100%; height: 100%; object-fit: cover; }
.pathway-photo::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 60%, rgba(14,23,38,0.4) 100%); }
.pathway-nav { display: flex; gap: 10px; margin-top: 24px; flex-wrap: wrap; }
.pathway-nav button {
  font: inherit; font-size: 13px; font-weight: 500;
  padding: 8px 16px;
  background: transparent; border: 1px solid ${T.border};
  border-radius: 8px;
  color: ${T.muted};
  cursor: pointer; transition: all .15s;
}
.pathway-nav button:hover:not(:disabled) { color: ${T.ink}; border-color: ${T.ink}; }
.pathway-nav button:disabled { opacity: 0.35; cursor: default; }
@media (max-width: 980px) {
  .pathway-panel { grid-template-columns: 1fr; gap: 24px; }
  .pathway-bars { height: 140px; }
  .pathway-bar-name { font-size: 12px; }
  .pathway-bar-tag { display: none; }
}

/* GAP — before/after toggle for Athlete Training "The gap" section */
.gap { margin-top: 16px; }
.gap-switch {
  display: inline-flex; padding: 4px;
  background: ${T.paper};
  border: 1px solid ${T.border};
  border-radius: 999px;
  margin-bottom: 40px; gap: 4px;
  position: relative;
}
.gap-switch button {
  padding: 10px 22px;
  font: inherit; font-size: 14px; font-weight: 600;
  background: transparent; border: 0; border-radius: 999px;
  color: ${T.muted}; cursor: pointer;
  transition: all .18s ease;
  white-space: nowrap;
  position: relative;
}
.gap-switch button.on { background: ${T.ink}; color: #fff; }
.gap-switch button.on.with { background: ${T.blue}; }
/* Pulse the "With CSE" option while "Without" is active — encourages discovery */
.gap-switch button.with:not(.on) { color: ${T.blue}; }
.gap-switch button.with:not(.on):hover { background: rgba(31,111,235,0.12); color: ${T.blueDark}; }
.gap-switch button.with:not(.on)::before {
  content: ''; position: absolute; inset: 0; border-radius: 999px;
  box-shadow: 0 0 0 0 rgba(31,111,235,0.55);
  animation: gapWithPulse 1.9s ease-out infinite;
  pointer-events: none;
}
.gap-switch button.with:not(.on)::after {
  content: '→'; margin-left: 6px; color: ${T.blue}; font-weight: 700;
  display: inline-block;
  animation: gapArrowNudge 1.6s ease-in-out infinite;
}
@keyframes gapWithPulse {
  0% { box-shadow: 0 0 0 0 rgba(31,111,235,0.5); }
  70% { box-shadow: 0 0 0 12px rgba(31,111,235,0); }
  100% { box-shadow: 0 0 0 0 rgba(31,111,235,0); }
}
@keyframes gapArrowNudge {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(3px); }
}
.gap-cards {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
  animation: journeyFade .4s ease;
}
.gap-card {
  padding: 28px;
  background: #fff;
  border: 1px solid ${T.border};
  border-radius: 14px;
  position: relative;
  overflow: hidden;
  transition: transform .25s ease, box-shadow .25s ease, border-color .15s ease;
}
.gap-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px -10px rgba(15,23,38,0.12); border-color: rgba(31,111,235,0.35); }
.gap-card::before {
  content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 3px;
  background: ${T.border};
}
.gap-card.on::before { background: ${T.blue}; }
.gap-card.off::before { background: ${T.border}; }
.gap-metric {
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 14px;
  color: ${T.muted};
}
.gap-card.on .gap-metric { color: ${T.blue}; }
.gap-card h4 { font-size: 20px; font-weight: 700; margin: 0 0 8px; color: ${T.ink}; line-height: 1.2; }
.gap-card p { font-size: 14px; line-height: 1.55; color: ${T.muted}; margin: 0; }
@media (max-width: 980px) { .gap-cards { grid-template-columns: 1fr; } }

/* STORY — Case Study act expander */
.story { display: grid; gap: 14px; transition: grid-template-columns .5s cubic-bezier(.4,0,.2,1); }
.story-card {
  position: relative;
  background: ${T.softer};
  color: ${T.ink};
  padding: 32px;
  border: 1px solid ${T.border};
  border-radius: 18px;
  min-height: 480px;
  cursor: pointer;
  transition: all .35s cubic-bezier(.4,0,.2,1);
  overflow: hidden;
  display: flex; flex-direction: column;
}
.story-card.closed { padding: 28px 20px; }
.story-card.closed:hover { background: rgba(232,65,58,0.05); border-color: rgba(232,65,58,0.3); }
.story-card.open {
  background: ${T.ink};
  color: #fff;
  border-color: ${T.ink};
}
.story-card.open:nth-child(3) {
  background: linear-gradient(135deg, ${T.ink} 0%, #4a2520 100%);
}
.story-act {
  font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
  color: ${T.red}; margin-bottom: 14px;
}
.story-card.closed .story-act { color: ${T.muted}; writing-mode: vertical-rl; transform: rotate(180deg); margin: 0; align-self: flex-start; }
.story-h { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.12; margin: 0; }
.story-card.closed .story-h { font-size: 22px; margin-top: 16px; }
.story-card.open .story-h { color: #fff; }
.story-body { margin-top: 24px; flex: 1; display: flex; flex-direction: column; gap: 18px; animation: journeyFade .45s ease; }
.story-body p { font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.85); margin: 0; }
.story-body ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.story-body li { font-size: 14px; line-height: 1.45; padding-left: 22px; position: relative; color: rgba(255,255,255,0.85); }
.story-body li::before { content: '→'; position: absolute; left: 0; color: ${T.red}; font-weight: 700; }
.story-stat {
  margin-top: auto; padding: 14px 18px;
  background: rgba(232,65,58,0.2);
  border-radius: 10px;
  font-size: 14px; font-weight: 700; color: #fff;
  align-self: flex-start;
  border: 1px solid rgba(232,65,58,0.35);
}
@media (max-width: 980px) {
  .story { display: flex; flex-direction: column; }
  .story-card.closed .story-act { writing-mode: horizontal-tb; transform: none; margin-bottom: 12px; }
  .story-card { min-height: auto; }
  .story-card.closed { padding: 24px; }
}

/* WHY CSE — kinetic ticker + alternating feature blocks + lineage + comparison */
.why-ticker {
  display: inline-flex; align-items: center; gap: 12px;
  margin-top: 32px;
  padding: 10px 18px;
  background: rgba(232,65,58,0.06);
  border: 1px solid rgba(232,65,58,0.2);
  border-radius: 999px;
  font-size: 14px; color: ${T.ink};
  font-weight: 500;
}
.why-ticker-dot { width: 8px; height: 8px; border-radius: 50%; background: ${T.red}; animation: pathwayHintPulse 1.6s infinite; flex-shrink: 0; }
.why-ticker-text { transition: opacity .35s ease; min-height: 1em; animation: tickerFade .4s ease; }
@keyframes tickerFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

.why-feature {
  display: grid; grid-template-columns: 1fr 1fr; gap: 80px;
  align-items: center;
  padding: 88px 0;
  border-bottom: 1px solid ${T.border};
}
.why-feature:last-of-type { border-bottom: none; padding-bottom: 0; }
.why-feature:first-of-type { padding-top: 0; }
.why-feature.reverse > div:first-child { order: 2; }
.why-feature.reverse > div:last-child { order: 1; }
.why-feature-num-eyebrow { font-size: 13px; font-weight: 700; color: ${T.red}; letter-spacing: 0.18em; margin-bottom: 16px; }
.why-feature-h { font-size: 40px; font-weight: 700; letter-spacing: -0.025em; line-height: 1.08; margin: 0 0 20px; color: ${T.ink}; }
.why-feature-body { font-size: 18px; line-height: 1.55; color: ${T.muted}; margin: 0 0 28px; max-width: 480px; }
.why-feature-bullets { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }
.why-feature-bullets li { display: flex; gap: 14px; font-size: 16px; color: ${T.ink}; line-height: 1.5; align-items: flex-start; }
.why-feature-bullets li::before { content: '✓'; flex: 0 0 24px; width: 24px; height: 24px; border-radius: 50%; background: rgba(232,65,58,0.1); color: ${T.red}; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; margin-top: 1px; }
.why-feature-photo { aspect-ratio: 5/6; border-radius: 20px; overflow: hidden; background: ${T.ink}; box-shadow: 0 40px 80px -30px rgba(15,23,38,0.3); position: relative; }
.why-feature-photo img { width: 100%; height: 100%; object-fit: cover; filter: contrast(1.05); display: block; }
.why-feature-photo::after { content: ''; position: absolute; inset: 0; background: linear-gradient(170deg, transparent 45%, rgba(14,23,38,0.55) 100%); }
.why-feature-num-overlay {
  position: absolute; bottom: 24px; left: 28px;
  font-size: 110px; font-weight: 800; color: rgba(255,255,255,0.96);
  letter-spacing: -0.05em; line-height: 0.85; z-index: 2;
  font-feature-settings: 'tnum';
  text-shadow: 0 2px 20px rgba(0,0,0,0.3);
}
.why-feature-num-overlay span { color: ${T.red}; }

/* LINEAGE CHAIN — visual flow */
.lineage {
  display: grid; grid-template-columns: 1fr auto 1fr auto 1fr;
  gap: 18px; align-items: stretch;
  margin-top: 48px;
}
.lineage-node {
  padding: 32px 28px;
  background: #fff;
  border: 1.5px solid ${T.border};
  border-radius: 18px;
  text-align: center;
  display: flex; flex-direction: column; gap: 12px;
  transition: transform .25s, box-shadow .25s, border-color .15s;
}
.lineage-node:hover { transform: translateY(-4px); border-color: rgba(232,65,58,0.4); box-shadow: 0 24px 50px -20px rgba(15,23,38,0.16); }
.lineage-node-icon {
  width: 60px; height: 60px;
  border-radius: 14px;
  background: rgba(232,65,58,0.1);
  display: inline-flex; align-items: center; justify-content: center;
  margin: 0 auto 4px;
  color: ${T.red};
}
.lineage-node-tag { font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: ${T.red}; }
.lineage-node-name { font-size: 20px; font-weight: 700; line-height: 1.2; color: ${T.ink}; letter-spacing: -0.01em; }
.lineage-node-body { font-size: 13px; line-height: 1.5; color: ${T.muted}; margin: 0; }
.lineage-arrow {
  display: flex; align-items: center; justify-content: center;
  color: ${T.red}; font-size: 28px; font-weight: 300;
  position: relative;
}
.lineage-arrow::before {
  content: ''; position: absolute; top: 50%; left: -10px; right: -10px;
  height: 1px; border-top: 2px dashed rgba(232,65,58,0.35);
  z-index: 0;
}
.lineage-arrow > span { position: relative; z-index: 1; background: ${T.soft}; padding: 4px 8px; border-radius: 50%; }
.lineage-node.terminal {
  background: ${T.ink}; color: #fff; border-color: ${T.ink};
}
.lineage-node.terminal .lineage-node-tag { color: ${T.red}; }
.lineage-node.terminal .lineage-node-name { color: #fff; }
.lineage-node.terminal .lineage-node-body { color: rgba(255,255,255,0.72); }
.lineage-node.terminal .lineage-node-icon { background: rgba(232,65,58,0.2); }

@media (max-width: 980px) {
  .lineage { grid-template-columns: 1fr; }
  .lineage-arrow { transform: rotate(90deg); padding: 8px 0; }
  .lineage-arrow::before { display: none; }
  .why-feature, .why-feature.reverse { grid-template-columns: 1fr; gap: 32px; padding: 56px 0; }
  .why-feature.reverse > div:first-child { order: 1; }
  .why-feature.reverse > div:last-child { order: 2; }
  .why-feature-num-overlay { font-size: 80px; }
}

/* COMPARISON TABLE */
.compare {
  background: #fff;
  border: 1px solid ${T.border};
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 1px 0 rgba(15,23,38,0.04), 0 12px 32px -16px rgba(15,23,38,0.08);
}
.compare-header {
  display: grid; grid-template-columns: 1.4fr 1fr 1fr;
  background: ${T.softer};
  border-bottom: 1px solid ${T.border};
}
.compare-th { padding: 22px 24px; }
.compare-th .compare-th-small { font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: ${T.muted}; }
.compare-th .compare-th-label { font-size: 17px; font-weight: 700; color: ${T.ink}; margin-top: 4px; letter-spacing: -0.01em; }
.compare-th:nth-child(2) { border-left: 1px solid ${T.border}; }
.compare-th:nth-child(3) { border-left: 1px solid ${T.border}; background: rgba(232,65,58,0.04); }
.compare-th:nth-child(3) .compare-th-small { color: ${T.red}; }
.compare-row {
  display: grid; grid-template-columns: 1.4fr 1fr 1fr;
  border-top: 1px solid ${T.border};
  transition: background .15s;
}
.compare-row:hover { background: ${T.softer}; }
.compare-cell { padding: 18px 24px; font-size: 14.5px; line-height: 1.45; }
.compare-cell.feat { font-weight: 600; color: ${T.ink}; display: flex; align-items: center; gap: 10px; }
.compare-cell.neg { color: ${T.muted}; border-left: 1px solid ${T.border}; display: flex; align-items: center; gap: 12px; }
.compare-cell.pos { color: ${T.ink}; border-left: 1px solid ${T.border}; background: rgba(232,65,58,0.03); display: flex; align-items: center; gap: 12px; }
.compare-row:hover .compare-cell.pos { background: rgba(232,65,58,0.06); }
.compare-mark { flex: 0 0 24px; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
.compare-mark.x { background: rgba(0,0,0,0.06); color: ${T.muted}; }
.compare-mark.v { background: rgba(232,65,58,0.15); color: ${T.red}; }
@media (max-width: 780px) {
  .compare-header { grid-template-columns: 1fr; }
  .compare-row { grid-template-columns: 1fr; }
  .compare-cell.feat { background: ${T.softer}; border-top: 1px solid ${T.border}; padding: 14px 24px; }
  .compare-cell.neg, .compare-cell.pos { border-left: none; }
}

/* === TWEAKS — feel-reshaping overrides ============================ */

/* Headline style: Editorial (serif) or Athletic (condensed all-caps) */
.style-serif .s-h1,
.style-serif .s-h2,
.style-serif .s-h3,
.style-serif .s-h4,
.style-serif .journey-h,
.style-serif .pathway-content h3,
.style-serif .why-feature-h,
.style-serif .lineage-node-name,
.style-serif .story-h,
.style-serif .s-cta h2 {
  font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
  font-variation-settings: 'opsz' 96, 'SOFT' 50;
  letter-spacing: -0.025em;
  font-weight: 700;
}
.style-athletic .s-h1,
.style-athletic .s-h2,
.style-athletic .s-h3,
.style-athletic .s-h4,
.style-athletic .journey-h,
.style-athletic .pathway-content h3,
.style-athletic .why-feature-h,
.style-athletic .lineage-node-name,
.style-athletic .story-h,
.style-athletic .s-cta h2 {
  font-family: 'Bebas Neue', 'Anton', Impact, sans-serif;
  font-weight: 400;
  letter-spacing: 0.005em;
  line-height: 1;
  text-transform: uppercase;
}
.style-athletic .s-h1 { letter-spacing: 0.01em; }
.style-athletic .s-pillar-title,
.style-athletic .program-title,
.style-athletic .gap-card h4 {
  font-family: 'Bebas Neue', sans-serif; font-weight: 400; letter-spacing: 0.01em; text-transform: uppercase;
}

/* Photo treatment: Natural (current default), Editorial (navy duotone), Mono */
.photo-editorial .s-photo,
.photo-editorial .pathway-photo,
.photo-editorial .journey-visual,
.photo-editorial .why-feature-photo,
.photo-editorial .s-hero-art,
.photo-editorial .s-founder-photo,
.photo-editorial .program-photo { position: relative; }
.photo-editorial .s-photo img,
.photo-editorial .pathway-photo img,
.photo-editorial .journey-visual img,
.photo-editorial .why-feature-photo img,
.photo-editorial .s-hero-art img,
.photo-editorial .s-founder-photo img,
.photo-editorial .program-photo img {
  filter: grayscale(1) contrast(1.18) brightness(1.04);
}
.photo-editorial .s-photo::before,
.photo-editorial .pathway-photo::before,
.photo-editorial .journey-visual::before,
.photo-editorial .why-feature-photo::before,
.photo-editorial .s-hero-art::before,
.photo-editorial .s-founder-photo::before,
.photo-editorial .program-photo::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(160deg, ${T.ink} 0%, #2c3a4a 100%);
  mix-blend-mode: multiply; opacity: 0.55; pointer-events: none; z-index: 1;
}
.photo-mono .s-photo img,
.photo-mono .pathway-photo img,
.photo-mono .journey-visual img,
.photo-mono .why-feature-photo img,
.photo-mono .s-hero-art img,
.photo-mono .s-founder-photo img,
.photo-mono .program-photo img {
  filter: grayscale(1) contrast(1.3) brightness(0.96);
}

/* Density: Tight or Spacious section padding */
.density-tight .s-section { padding: 56px 0; }
.density-tight .s-section.tight { padding: 32px 0; }
.density-tight .s-hero { padding: 56px 0 64px; }
.density-tight .why-feature { padding: 56px 0; }
.density-spacious .s-section { padding: 144px 0; }
.density-spacious .s-section.tight { padding: 88px 0; }
.density-spacious .s-hero { padding: 96px 0 128px; }
.density-spacious .why-feature { padding: 120px 0; }

/* PROGRAM PROGRESSION GRID — Home preview */
.program-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; align-items: stretch; }
.program-card {
  position: relative;
  border: 1px solid ${T.border};
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  display: flex; flex-direction: column;
  transition: transform .25s ease, box-shadow .25s ease, border-color .15s ease;
  cursor: pointer;
}
.program-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -16px rgba(15,23,38,0.18); border-color: rgba(232,65,58,0.4); }
.program-photo { aspect-ratio: 4/3; overflow: hidden; position: relative; background: ${T.ink}; }
.program-photo img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
.program-card:hover .program-photo img { transform: scale(1.06); }
.program-body { padding: 20px 22px 22px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
.program-num { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; color: ${T.red}; text-transform: uppercase; }
.program-num span { color: ${T.hint}; }
.program-title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; margin: 2px 0 0; color: ${T.ink}; }
.program-text { font-size: 14px; line-height: 1.5; color: ${T.muted}; margin: 4px 0 0; flex: 1; }
.program-rungs { display: flex; gap: 4px; margin-top: 16px; }
.program-rung { flex: 1; height: 4px; border-radius: 2px; background: rgba(15,23,38,0.08); transition: background .3s; }
.program-rung.on { background: ${T.red}; }

/* Gold (top) card — inverted */
.program-card.top { background: ${T.ink}; border-color: ${T.ink}; }
.program-card.top .program-photo::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(14,23,38,0) 30%, rgba(14,23,38,0.6) 100%); }
.program-card.top .program-title { color: #fff; }
.program-card.top .program-text { color: rgba(255,255,255,0.72); }
.program-card.top .program-rung { background: rgba(255,255,255,0.15); }
.program-card.top .program-rung.on { background: ${T.red}; }
.program-card.top::before {
  content: 'Top tier';
  position: absolute; top: 12px; right: 12px;
  padding: 4px 10px; background: ${T.red}; color: #fff;
  font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  border-radius: 999px; z-index: 2;
}
@media (max-width: 980px) { .program-grid { grid-template-columns: repeat(2, 1fr); } }

/* FOUNDER */
.s-founder { display: grid; grid-template-columns: 320px 1fr; gap: 48px; align-items: start; }
.s-founder.reverse { grid-template-columns: 1fr 320px; }
.s-founder-photo { aspect-ratio: 4/5; border-radius: 18px; overflow: hidden; background: ${T.ink}; }
.s-founder-photo img { width: 100%; height: 100%; object-fit: cover; object-position: center 20%; }
.s-founder-credits { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; margin-top: 20px; }
.s-founder-credit { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: ${T.text}; line-height: 1.45; }
.s-founder-credit::before { content: ''; flex: 0 0 6px; width: 6px; height: 6px; border-radius: 50%; background: ${T.red}; margin-top: 8px; }
.s-confirm { display: inline-block; padding: 1px 7px; border-radius: 4px; background: #FEF3C7; color: #92400E; font-size: 11px; font-weight: 600; margin-left: 6px; vertical-align: 2px; }

/* FORM */
.s-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 720px; }
.s-form .full { grid-column: 1 / -1; }
.s-field { display: flex; flex-direction: column; gap: 6px; }
.s-field label { font-size: 13px; font-weight: 500; color: ${T.text}; }
.s-field input, .s-field textarea, .s-field select {
  font: inherit; font-size: 15px; color: ${T.ink};
  padding: 12px 14px; border-radius: 10px; border: 1px solid ${T.border};
  background: ${T.paper}; outline: none; transition: border-color .12s, box-shadow .12s;
}
.s-field input:focus, .s-field textarea:focus { border-color: ${T.red}; box-shadow: 0 0 0 3px rgba(232,65,58,0.12); }
.s-field textarea { resize: vertical; min-height: 96px; font-family: inherit; }

/* LOGO TILE */
.s-logo-tile { display: inline-flex; align-items: center; justify-content: center; padding: 12px 16px; background: #fff; border: 1px solid ${T.border}; border-radius: 12px; }
.s-logo-tile img { height: 48px; width: auto; object-fit: contain; }

/* ANIMATIONS */
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.s-section > .s-container > * { animation: fadeUp 0.5s ease-out backwards; }

/* RESPONSIVE — collapse grids on small viewports */
@media (max-width: 980px) {
  .s-hero-grid, .g-split, .g-split-reverse { grid-template-columns: 1fr; gap: 32px; }
  .g-3, .g-4 { grid-template-columns: 1fr 1fr; }
  .s-founder, .s-founder.reverse { grid-template-columns: 1fr; }
  .s-footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
  .s-cta-inner { flex-direction: column; align-items: flex-start; }
  .s-level { flex-direction: column; align-items: flex-start; }
  .s-level-photo { width: 100%; height: 200px; flex: none; }
}
`;

// ─── ATOMS ─────────────────────────────────────────────────────────────────
const Btn = ({ children, variant = 'primary', onClick }) => (
  <button className={`s-btn s-btn-${variant}`} onClick={onClick}>{children}</button>
);

const Pill = ({ children, variant }) => (
  <span className={`s-pill ${variant || ''}`}>{children}</span>
);

const Eyebrow = ({ children, variant }) => (
  <p className={`s-eyebrow ${variant || ''}`}>{children}</p>
);

const Photo = ({ src, alt, style, className = '' }) => (
  <div className={`s-photo ${className}`} style={style}>
    <img src={src} alt={alt || ''} referrerPolicy="no-referrer" />
  </div>
);

// Number that animates 0 → target when it scrolls into MID-screen. Plays once.
const CountUp = ({ to, suffix = '', duration = 1400 }) => {
  const ref = React.useRef(null);
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const start = performance.now();
        const tick = (t) => {
          const p = Math.min((t - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
          setN(Math.round(to * eased));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        io.disconnect();
      }
    }, { threshold: 0, rootMargin: '-45% 0px -45% 0px' });
    io.observe(el);
    return () => { io.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [to, duration]);
  return <span ref={ref}>{n}{suffix}</span>;
};

// SaaS feature icon — simple geometric SVG marks (matches red chevron motif)
const FeatIcon = ({ kind }) => {
  const icons = {
    brand:    <path d="M3 6l9-3 9 3v6c0 5-3.5 8.5-9 10-5.5-1.5-9-5-9-10V6z" stroke="#E8413A" strokeWidth="2" fill="none" strokeLinejoin="round" />,
    proven:   <path d="M5 12l4 4 10-10" stroke="#E8413A" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    managed:  <><circle cx="12" cy="12" r="3" stroke="#E8413A" strokeWidth="2" fill="none" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke="#E8413A" strokeWidth="2" strokeLinecap="round" /></>,
    raise:    <path d="M3 17l5-5 4 4 9-9" stroke="#E8413A" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    safe:     <path d="M12 2L4 5v7c0 5 3.3 8.3 8 10 4.7-1.7 8-5 8-10V5l-8-3z" stroke="#E8413A" strokeWidth="2" fill="none" />,
    consist:  <><rect x="3" y="4" width="18" height="6" rx="1" stroke="#E8413A" strokeWidth="2" fill="none" /><rect x="3" y="14" width="18" height="6" rx="1" stroke="#E8413A" strokeWidth="2" fill="none" /></>,
  };
  return (
    <div className="s-feat-icon">
      <svg viewBox="0 0 24 24">{icons[kind]}</svg>
    </div>
  );
};

// ─── CHROME: HEADER / FOOTER / CTA ─────────────────────────────────────────
const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'how', label: 'How it works' },
  { id: 'programs', label: 'Programs' },
  { id: 'athletes', label: 'Athlete Training' },
  { id: 'case', label: 'Case study' },
  { id: 'why', label: 'Why CSE' },
  { id: 'about', label: 'About' },
];

const Header = ({ page, go }) => (
  <header className="s-header">
    <div className="s-container s-header-inner">
      <div className="s-brand" onClick={() => go('home')}>
        <img src="assets/cse-logo.png" alt="CSE" />
        <div className="s-brand-text"><b>CSE</b><span>Combat Sports Education</span></div>
      </div>
      <nav className="s-nav">
        {NAV.map(n => (
          <a key={n.id} className={page === n.id ? 'active' : ''} onClick={() => go(n.id)}>{n.label}</a>
        ))}
      </nav>
      <div className="s-header-cta">
        <a className="s-login" href="https://combatsportseducation.ezycourse.com/en/all-products/" target="_blank" rel="noopener">Login ↗</a>
        <Btn onClick={() => go('demo')}>Book a Demo →</Btn>
      </div>
    </div>
  </header>
);

const Footer = ({ go }) => (
  <footer className="s-footer">
    <div className="s-container">
      <div className="s-footer-grid">
        <div className="s-footer-col s-footer-brand">
          <div className="s-brand">
            <img src="assets/cse-logo.png" alt="CSE" style={{ filter: 'brightness(1.5) saturate(1.2)' }} />
            <div className="s-brand-text"><b style={{ color: '#fff' }}>CSE</b><span style={{ color: 'rgba(255,255,255,0.55)' }}>Combat Sports Education</span></div>
          </div>
          <p>White-label coach & athlete certification for organizations worldwide.</p>
        </div>
        <div className="s-footer-col">
          <h6>Programs</h6>
          <a onClick={() => go('programs')}>Coach Certification</a>
          <a onClick={() => go('athletes')}>Athlete Training</a>
        </div>
        <div className="s-footer-col">
          <h6>Company</h6>
          <a onClick={() => go('how')}>How It Works</a>
          <a onClick={() => go('why')}>Why CSE</a>
          <a onClick={() => go('about')}>About</a>
          <a onClick={() => go('case')}>Case Study</a>
        </div>
        <div className="s-footer-col">
          <h6>Get Started</h6>
          <a onClick={() => go('demo')}>Book a Demo</a>
          <a href="https://combatsportseducation.ezycourse.com/en/all-products/" target="_blank" rel="noopener">CSE courses ↗</a>
        </div>
        <div className="s-footer-col">
          <h6>Legal</h6>
          <a onClick={() => go('privacy')}>Privacy</a>
          <a onClick={() => go('terms')}>Terms</a>
        </div>
      </div>
      <div className="s-footer-base">
        <div>© 2026 Combat Sports Education. All rights reserved.</div>
        <div>Built for organizations worldwide.</div>
      </div>
    </div>
  </footer>
);

const CTABand = ({ go, headline, sub }) => (
  <div className="s-section">
    <div className="s-container">
      <div className="s-cta">
        <div className="s-cta-inner">
          <div>
            <h2>{headline || 'Bring a recognized certification program to your organization.'}</h2>
            <p>{sub || 'See the platform in your own colors. Book a 30-minute walkthrough — no commitment.'}</p>
          </div>
          <Btn onClick={() => go('demo')}>Book a Demo →</Btn>
        </div>
      </div>
    </div>
  </div>
);

// Export all atoms + chrome to window for the second script file to use
Object.assign(window, { T, PHOTOS, saasCss, Btn, Pill, Eyebrow, Photo, CountUp, FeatIcon, Header, Footer, CTABand, NAV });
