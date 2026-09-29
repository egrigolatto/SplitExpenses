const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function resolveMeetingName(name: string, date: Date = new Date()): string {
  const trimmed = name.trim();

  if (trimmed !== "") {
    return trimmed;
  }

  return `Reunión ${dateFormatter.format(date)}`;
}
