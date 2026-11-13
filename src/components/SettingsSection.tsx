/** T-01…T-06: Settings. The move-tones switch is PLACEHOLDER-LAYOUT (not in the supplied design). */
import type { ReactNode } from 'react';
import { fillTemplate, strings } from '../data/strings';
import type { ExplorerController } from '../hooks/useExplorerController';
import type { AppState } from '../store';
import { SegmentedControl, Switch } from './controls';

export function SettingsSection(props: { readonly state: AppState; readonly ctl: ExplorerController }): ReactNode {
  const { state, ctl } = props;
  return (
    <section className="ej-panel" aria-labelledby="settings-heading">
      <h3 id="settings-heading" className="ej-h3">
        {strings.settings.heading}
      </h3>
      <SegmentedControl
        legend={strings.settings.announcementsLabel}
        options={[
          { value: 'short', label: strings.settings.short },
          { value: 'detailed', label: strings.settings.detailed },
          { value: 'sound-only', label: strings.settings.soundOnly },
        ]}
        value={state.announcements}
        onChange={ctl.setAnnouncements}
      />
      <div className="ej-field">
        <label htmlFor="volume-slider" className="ej-field__legend">
          {strings.settings.volumeLabel}
        </label>
        <input
          id="volume-slider"
          type="range"
          min={0}
          max={100}
          step={1}
          value={state.volume}
          aria-valuetext={fillTemplate(strings.settings.volumeValue, { volume: state.volume })}
          onChange={(e) => ctl.setVolume(Number(e.currentTarget.value))}
        />
      </div>
      <SegmentedControl
        legend={strings.settings.speedLabel}
        options={[
          { value: 0.5, label: '0.5×' },
          { value: 1, label: '1×' },
          { value: 1.5, label: '1.5×' },
        ]}
        value={state.speed}
        onChange={ctl.setSpeed}
      />
      <Switch label={strings.settings.invertLabel} checked={state.invert} onChange={ctl.setInvert} />
      <Switch label={strings.settings.moveTonesLabel} checked={state.moveTones} onChange={ctl.setMoveTones} />
    </section>
  );
}
