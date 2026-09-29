const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

export function formatAmount(amount: number): string {
  return currencyFormatter.format(amount);
}
