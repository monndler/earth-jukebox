/** The landing page, shown as the Track Library view. All text comes from `strings.landing`. */
import type { CSSProperties, ReactNode } from 'react';
import { fillTemplate, strings } from '../data/strings';
import type { Track } from '../types/track';
import './TrackLibrary.css';

/** Decorative waveform bars on each card. The heights are a fixed formula, so the picture is deterministic. */
const WAVEFORM_BARS = 40;

function barHeight(i: number): string {
  return `${18 + Math.abs(Math.sin(i * 0.63) * Math.cos(i * 0.17)) * 78}%`;
}

export function TrackLibrary(props: {
  readonly tracks: readonly Track[];
  readonly onSelect: (trackId: string) => void;
}): ReactNode {
  const t = strings.landing;
  return (
    <main className="home-shell">
      <nav className="home-nav" aria-label={t.navLabel}>
        <a className="brand" href="#top" aria-label={t.brandLabel}>
          <span className="brand-mark" aria-hidden="true">◉</span> {t.brandA} <b>{t.brandB}</b>
        </a>
        <div className="nav-links">
          <a href="#about">{t.navAbout}</a>
          <a href="#experience">{t.navExplore}</a>
          <a href="#accessibility">{t.navAccessibility}</a>
        </div>
        <a className="nav-cta" href="#experience">
          {t.navCta} <span aria-hidden="true">↗</span>
        </a>
      </nav>

      <section className="home-hero" id="top" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="live-dot" aria-hidden="true" /> {t.eyebrow}
          </p>
          <h1 id="hero-title">
            {t.heroLine1}
            <br />
            <em>{t.heroLine2}</em>
            <br />
            {t.heroLine3}
          </h1>
          <p className="hero-description">{t.heroDescription}</p>
          <div className="hero-actions">
            <a className="primary-link" href="#experience">
              {t.heroPrimary} <span aria-hidden="true">→</span>
            </a>
            <a className="text-link" href="#about">
              {t.heroSecondary}
            </a>
          </div>
          <div className="hero-note">
            <span className="note-icon" aria-hidden="true">♫</span>
            <span>
              {t.noteLine1}
              <br />
              <b>{t.noteLine2}</b>
            </span>
          </div>
        </div>
        <div className="hero-art" role="img" aria-label={t.artLabel}>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="planet">
            <div className="planet-shine" />
            <div className="planet-land land-one" />
            <div className="planet-land land-two" />
          </div>
          <div className="sound-ring ring-one" />
          <div className="sound-ring ring-two" />
          <div className="sound-ring ring-three" />
          <span className="art-label label-top">{t.artTop}</span>
          <span className="art-label label-bottom">{t.artBottom}</span>
        </div>
      </section>

      <section className="experience-section" id="experience">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.experienceEyebrow}</p>
            <h2>{t.experienceHeading}</h2>
          </div>
          <p>{t.experienceIntro}</p>
        </div>
        {props.tracks.length === 0 ? (
          <p role="status">{t.empty}</p>
        ) : (
          <div className="experience-grid">
            {props.tracks.map((track, index) => (
              <article className="experience-card" key={track.id}>
                <div className="card-visual">
                  <span className="card-index">{fillTemplate(t.cardIndex, { n: `0${index + 1}` })}</span>
                  <div className="waveform" aria-hidden="true">
                    {Array.from({ length: WAVEFORM_BARS }, (_, i) => (
                      <i key={i} style={{ '--bar': barHeight(i) } as CSSProperties} />
                    ))}
                  </div>
                  <span className="card-orb" />
                </div>
                <div className="card-content">
                  <div>
                    <p className="card-kicker">{t.cardKicker}</p>
                    <h3>{track.title}</h3>
                    <p>{track.summary}</p>
                  </div>
                  <button type="button" className="card-button" onClick={() => props.onSelect(track.id)}>
                    {t.cardButton} <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="about-strip" id="about">
        <div>
          <p className="eyebrow">{t.aboutEyebrow}</p>
          <h2>
            {t.aboutHeadingA}
            <br />
            <em>{t.aboutHeadingB}</em>
          </h2>
        </div>
        <p>{t.aboutText}</p>
      </section>

      <footer className="home-footer" id="accessibility">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true">◉</span> {t.brandA} <b>{t.brandB}</b>
        </span>
        <span>{t.footerTagline}</span>
        <span>{t.footerCredit}</span>
      </footer>
    </main>
  );
}
