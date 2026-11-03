import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false during SSR and hydration, true afterwards; guards localStorage-backed UI. */
export function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
