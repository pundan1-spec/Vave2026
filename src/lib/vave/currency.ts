export type CurrencyCode = "INR" | "USD" | "EUR";

// Anchor rates to USD. Adjust in one place when FX shifts materially.
// INR default for the Indian-OEM context.
export const FX: Record<CurrencyCode, { per_usd: number; symbol: string; locale: string }> = {
  INR: { per_usd: 83.5, symbol: "₹", locale: "en-IN" },
  USD: { per_usd: 1.0, symbol: "$", locale: "en-US" },
  EUR: { per_usd: 0.92, symbol: "€", locale: "de-DE" },
};

export function convert(amountUsd: number, currency: CurrencyCode): number {
  return amountUsd * FX[currency].per_usd;
}

export function formatMoney(
  amountUsd: number,
  currency: CurrencyCode,
  opts: { compact?: boolean; fractionDigits?: number } = {},
): string {
  const v = convert(amountUsd, currency);
  const { symbol, locale } = FX[currency];
  const fractionDigits =
    opts.fractionDigits ?? (currency === "INR" ? 0 : 2);

  if (opts.compact) {
    // Indian crore/lakh formatting for INR; compact for others.
    if (currency === "INR") {
      const abs = Math.abs(v);
      if (abs >= 1e7)
        return `${symbol}${(v / 1e7).toFixed(2)} Cr`;
      if (abs >= 1e5)
        return `${symbol}${(v / 1e5).toFixed(2)} L`;
    }
    const formatted = new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(v);
    return `${symbol}${formatted}`;
  }

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(v);
  return `${symbol}${formatted}`;
}

export function signed(amount: number): string {
  return amount > 0 ? "+" : "";
}
