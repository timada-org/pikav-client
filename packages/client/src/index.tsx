import { createSignal } from "solid-js";

export function useCount() {
  const [count, setCount] = createSignal(0);

  return [count, { setCount }] as const;
}
