export function formatCurrency(value: number | string, currency = "USD") {
  const amount = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(amount)) return "$0";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}
