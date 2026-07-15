export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function parseMoneyToCents(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const n = Number.parseFloat(normalized);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

export function marginPercent(costCents: number, priceCents: number): number {
  if (priceCents <= 0) return 0;
  return Math.round(((priceCents - costCents) / priceCents) * 1000) / 10;
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
