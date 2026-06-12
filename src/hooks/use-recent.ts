const KEY = "kh_recent_v1";
export function pushRecent(id: string) {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(KEY);
  const arr: string[] = raw ? JSON.parse(raw) : [];
  const next = [id, ...arr.filter(x => x !== id)].slice(0, 8);
  localStorage.setItem(KEY, JSON.stringify(next));
}
export function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}
