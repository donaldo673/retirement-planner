const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatChartCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatCompactChartCurrency(value: number): string {
  return compactCurrencyFormatter.format(value);
}
