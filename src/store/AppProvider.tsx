/** Provides the app state and dispatch (the logic lives in ./index.ts). */
import { useReducer, type ReactNode } from 'react';
import { DispatchContext, StateContext, createInitialState, reducer } from './index';

export function AppProvider({
  defaultTrackId,
  children,
}: {
  defaultTrackId: string;
  children: ReactNode;
}): ReactNode {
  const [state, dispatch] = useReducer(reducer, defaultTrackId, createInitialState);
  return (
    <StateContext value={state}>
      <DispatchContext value={dispatch}>
        {children}
      </DispatchContext>
    </StateContext>
  );
}
