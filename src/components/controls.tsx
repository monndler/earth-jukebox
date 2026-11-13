/** Small native-element controls shared by Settings and the frame choice. */
import { useId, type ReactNode } from 'react';

export interface SegmentOption<T extends string | number> {
  readonly value: T;
  readonly label: string;
}

/** Radio group styled as a segmented control (UI_FUNCTION_MAP T-01, T-03). Native radios: arrow keys work. */
export function SegmentedControl<T extends string | number>(props: {
  readonly legend: string;
  readonly options: readonly SegmentOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}): ReactNode {
  const name = useId();
  return (
    <fieldset className="ej-field">
      <legend className="ej-field__legend">{props.legend}</legend>
      <div className="ej-segmented" role="radiogroup" aria-label={props.legend}>
        {props.options.map((o) => (
          <label key={String(o.value)} className="ej-segmented__item">
            <input
              type="radio"
              name={name}
              checked={props.value === o.value}
              onChange={() => props.onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** On/off switch (T-04, T-06): a native button with role="switch". */
export function Switch(props: {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}): ReactNode {
  const labelId = useId();
  return (
    <div className="ej-switch-row">
      <span id={labelId} className="ej-switch-row__label">
        {props.label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={props.checked}
        aria-labelledby={labelId}
        className="ej-switch"
        onClick={() => props.onChange(!props.checked)}
      >
        <span className="ej-switch__thumb" aria-hidden="true" />
      </button>
    </div>
  );
}
