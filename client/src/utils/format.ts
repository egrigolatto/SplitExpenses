const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatAmount(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatMeetingDate(value: string): string {
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (isoDate?.[1] !== undefined && isoDate[2] !== undefined && isoDate[3] !== undefined) {
    return formatDate(new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3])));
  }

  return formatDate(new Date(value));
}

const monthLongFormatter = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });

export function formatMonthLabel(key: string): string {
  const month = /^(\d{4})-(\d{2})$/.exec(key);

  if (month?.[1] !== undefined && month[2] !== undefined) {
    return monthLongFormatter.format(new Date(Number(month[1]), Number(month[2]) - 1, 1));
  }

  return key;
}

export function formatMonthAxisLabel(key: string): string {
  const month = /^(\d{4})-(\d{2})$/.exec(key);

  if (month?.[1] === undefined || month[2] === undefined) {
    return key;
  }

  return `${month[2]}/${month[1].slice(2)}`;
}
