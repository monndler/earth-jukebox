/**
 * The landing page, shown as the Track Library view. All text comes from `strings.landing`, and every number on it
 * is computed from the track list (nothing is typed in). Nothing here is invented data.
 */
import type { ReactNode } from 'react';
import { fillTemplate, strings } from '../data/strings';
import type { Track } from '../types/track';
import './TrackLibrary.css';

/** Decorative waveform bars on each card. The heights are a fixed formula, so the picture is deterministic. */
const WAVEFORM_BARS = 40;

function barHeight(i: number): string {
  return `${18 + Math.abs(Math.sin(i * 0.63) * Math.cos(i * 0.17)) * 78}%`;
}

/** "10 × 8" when every track uses the same Explore grid, otherwise null. */
function sharedGrid(tracks: readonly Track[]): string | null {
  const first = tracks[0];
  if (first === undefined) {
    return null;
  }
  const same = tracks.every(
    (t) => t.exploreGrid.cols === first.exploreGrid.cols && t.exploreGrid.rows === first.exploreGrid.rows,
  );
  return same ? `${first.exploreGrid.cols} × ${first.exploreGrid.rows}` : null;
}

export function TrackLibrary(props: {
  readonly tracks: readonly Track[];
  readonly onSelect: (trackId: string) => void;
}): ReactNode {
  const t = strings.landing;
  const frameCount = props.tracks.reduce((sum, track) => sum + track.frames.length, 0);
  const sourceCount = new Set(props.tracks.map((track) => track.source.url)).size;
  const cells = sharedGrid(props.tracks) ?? t.statCellsMixed;
  const stats: readonly { readonly label: string; readonly value: string }[] = [
    { label: t.statTracks, value: String(props.tracks.length) },
    { label: t.statFrames, value: String(frameCount) },
    { label: t.statCells, value: cells },
    { label: t.statSources, value: String(sourceCount) },
  ];

  return (
    <main className="lp">
      <nav className="lp-nav" aria-label={t.navLabel}>
        <a className="lp-brand" href="#top" aria-label={t.brandLabel}>
          <span className="lp-brand__mark" aria-hidden="true">◉</span>
          <span>
            {t.brandA} <b>{t.brandB}</b>
          </span>
        </a>
        <div className="lp-nav__links">
          <a href="#about">{t.navAbout}</a>
          <a href="#experience">{t.navTracks}</a>
          <a href="#how">{t.navHow}</a>
        </div>
        <a className="lp-btn lp-btn--primary lp-nav__cta" href="#experience">
          {t.navCta}
        </a>
      </nav>

      <section className="lp-hero" id="top" aria-labelledby="hero-title">
        <div className="lp-hero__copy">
          <p className="lp-eyebrow">{t.eyebrow}</p>
          <h1 id="hero-title" className="lp-hero__title">
            {t.heroLine1}
            <br />
            <em>{t.heroLine2}</em>
            <br />
            {t.heroLine3}
          </h1>
          <p className="lp-hero__text">{t.heroDescription}</p>
          <div className="lp-hero__actions">
            <a className="lp-btn lp-btn--primary" href="#experience">
              {t.heroPrimary} <span aria-hidden="true">→</span>
            </a>
            <a className="lp-btn lp-btn--glass" href="#how">
              {t.heroSecondary}
            </a>
          </div>
        </div>
        <div className="lp-art" role="img" aria-label={t.artLabel}>
          <span className="lp-art__ring lp-art__ring--1" />
          <span className="lp-art__ring lp-art__ring--2" />
          <span className="lp-art__ring lp-art__ring--3" />
          <span className="lp-art__planet" />
        </div>
      </section>

      <section className="lp-glance" aria-label={t.glanceLabel}>
        <dl className="lp-glance__grid">
          {stats.map((stat) => (
            <div className="lp-glass lp-stat" key={stat.label}>
              <dt className="lp-stat__label">{stat.label}</dt>
              <dd className="lp-stat__value">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="lp-section" id="experience" aria-labelledby="experience-title">
        <header className="lp-section__head">
          <p className="lp-eyebrow">{t.experienceEyebrow}</p>
          <h2 id="experience-title">{t.experienceHeading}</h2>
          <p className="lp-muted">{t.experienceIntro}</p>
        </header>
        {props.tracks.length === 0 ? (
          <p role="status">{t.empty}</p>
        ) : (
          <div className="lp-cards">
            {props.tracks.map((track, index) => (
              <article className="lp-glass lp-card" key={track.id}>
                <div className="lp-card__visual" aria-hidden="true">
                  <span className="lp-card__index">{fillTemplate(t.cardIndex, { n: `0${index + 1}` })}</span>
                  <div className="lp-wave">
                    {Array.from({ length: WAVEFORM_BARS }, (_, i) => (
                      <i key={i} style={{ height: barHeight(i) }} />
                    ))}
                  </div>
                </div>
                <div className="lp-card__body">
                  <p className="lp-eyebrow">{t.cardKicker}</p>
                  <h3>{track.title}</h3>
                  <p className="lp-muted">{track.summary}</p>
                  <p className="lp-meta">
                    {fillTemplate(t.cardMeta, {
                      frames: track.frames.length,
                      cols: track.exploreGrid.cols,
                      rows: track.exploreGrid.rows,
                    })}
                  </p>
                  <button type="button" className="lp-btn lp-btn--primary" onClick={() => props.onSelect(track.id)}>
                    {t.cardButton} <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="lp-section" id="how" aria-labelledby="how-title">
        <header className="lp-section__head">
          <p className="lp-eyebrow">{t.howEyebrow}</p>
          <h2 id="how-title">{t.howHeading}</h2>
        </header>
        <ol className="lp-steps">
          {t.howSteps.map((step, i) => (
            <li className="lp-glass lp-step" key={step.title}>
              <span className="lp-step__num" aria-hidden="true">
                {i + 1}
              </span>
              <h3>{step.title}</h3>
              <p className="lp-muted">{step.text}</p>
            </li>
          ))}
        </ol>
        <p className="lp-muted lp-note">{t.howNote}</p>
      </section>

      <section className="lp-section lp-about" id="about" aria-labelledby="about-title">
        <div className="lp-glass lp-about__box">
          <div>
            <p className="lp-eyebrow">{t.aboutEyebrow}</p>
            <h2 id="about-title">
              {t.aboutHeadingA}
              <br />
              <em>{t.aboutHeadingB}</em>
            </h2>
          </div>
          <p>{t.aboutText}</p>
        </div>
      </section>

      <footer className="lp-footer">
        <span className="lp-brand">
          <span className="lp-brand__mark" aria-hidden="true">◉</span>
          <span>
            {t.brandA} <b>{t.brandB}</b>
          </span>
        </span>
        <span>{t.footerTagline}</span>
        <span>{t.footerCredit}</span>
      </footer>
    </main>
  );
}
