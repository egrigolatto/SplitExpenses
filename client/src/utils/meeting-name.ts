import { formatDate } from "./format";

export function resolveMeetingName(name: string, date: Date = new Date()): string {
  const trimmed = name.trim();

  if (trimmed !== "") {
    return trimmed;
  }

  return `Reunión ${formatDate(date)}`;
}
