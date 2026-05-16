declare global {
  var ym: ((id: number, method: string, ...args: unknown[]) => void) | undefined;
}

const YM_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID
  ? Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID)
  : null;

export function ymGoal(goalName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !YM_ID || !window.ym) return;
  window.ym(YM_ID, "reachGoal", goalName, params);
}
