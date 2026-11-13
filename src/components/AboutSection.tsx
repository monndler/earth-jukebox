/** A-01 / A-02: About. Text comes from the track's data; every frame is credited. */
import type { ReactNode } from 'react';
import { strings } from '../data/strings';
import type { Track } from '../types/track';

export function AboutSection(props: { readonly track: Track }): ReactNode {
  const { track } = props;
  return (
    <section className="ej-panel" aria-labelledby="about-heading">
      <h3 id="about-heading" className="ej-h3">
        {strings.sections.about}
      </h3>
      <p>{track.storyText}</p>
      <h4 className="ej-h4">{strings.about.canTellHeading}</h4>
      <p>{track.aboutText.canTell}</p>
      <h4 className="ej-h4">{strings.about.cannotTellHeading}</h4>
      <p>{track.aboutText.cannotTell}</p>
      <h4 className="ej-h4">{strings.about.attributionHeading}</h4>
      <p>
        <a href={track.source.url} target="_blank" rel="noreferrer">
          {track.source.name}
        </a>
      </p>
      <p>{track.source.credit}</p>
      <p>{track.source.licenseNote}</p>
      <p className="ej-helper">{track.whyNotes}</p>
    </section>
  );
}
