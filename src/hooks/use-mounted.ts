import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True only after client-side hydration — safe way to gate rendering of
 * client-only state (e.g. next-themes' resolved theme) without triggering
 * the set-state-in-effect lint rule. */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
