import type { Cadence, Group } from "./ideas";
export type BucketItem = {
  id: string;
  title: string;
  group: Group;
  cadence: Cadence;
  completedPeriods: string[];
};
export const STORAGE_KEY = "odyssey-bucket-preview-v1";
export const cadenceLabels: Record<Cadence, string> = {
  once: "One day",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};
export function periodKey(cadence: Cadence, date = new Date()): string {
  if (cadence === "once") return "once";
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (cadence === "weekly")
    local.setDate(local.getDate() - ((local.getDay() + 6) % 7));
  const year = local.getFullYear(),
    month = String(local.getMonth() + 1).padStart(2, "0");
  return cadence === "monthly"
    ? `${year}-${month}`
    : `${year}-${month}-${String(local.getDate()).padStart(2, "0")}`;
}
export function readBucket(raw: string | null): BucketItem[] {
  if (!raw || raw.length > 1000000) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const ids = new Set<string>();
    return parsed.filter((item): item is BucketItem => {
      if (!item || typeof item !== "object") return false;
      const x = item as BucketItem;
      if (
        typeof x.id !== "string" ||
        x.id.length > 160 ||
        ids.has(x.id) ||
        typeof x.title !== "string" ||
        !x.title.trim() ||
        x.title.length > 100 ||
        !["move", "make", "taste", "connect", "explore", "home"].includes(
          x.group,
        ) ||
        !["once", "daily", "weekly", "monthly"].includes(x.cadence) ||
        !Array.isArray(x.completedPeriods) ||
        !x.completedPeriods.every(
          (p) =>
            typeof p === "string" &&
            (p === "once" || /^\d{4}-\d{2}(-\d{2})?$/.test(p)),
        )
      )
        return false;
      ids.add(x.id);
      return true;
    });
  } catch {
    return [];
  }
}
