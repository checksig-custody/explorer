// The parts of an asset or denom metadata that a supply row reads.
export interface SupplyAssetInfo {
  symbol?: string | undefined;
  base?: string | undefined;
  display?: string | undefined;
  logo_URIs?:
    { png?: string | undefined; svg?: string | undefined } | undefined;
}

export interface SupplyRow {
  denom: string;
  amount: string;
  base: string;
  info: string;
  logo: string;
}

// value, or fallback when value is empty or missing. It is not orDefault from
// utils because the node test runs this file without the `@/` alias.
function orElse(value: string | undefined, fallback: string) {
  if (value) return value;
  return fallback;
}

// A denom with neither asset config nor metadata (asset is undefined) falls
// back to the coin's own denom.
export function supplyRow(
  coin: { denom: string; amount: string },
  asset: SupplyAssetInfo | undefined,
  amountOf: (denom: string) => string
): SupplyRow {
  const denom = orElse(asset?.symbol, coin.denom);
  const parts = denom.split('/');
  return {
    denom: (parts[parts.length - 1] ?? denom).toUpperCase(),
    amount: amountOf(denom),
    base: orElse(asset?.base, coin.denom),
    info: orElse(asset?.display, coin.denom),
    logo: orElse(
      asset?.logo_URIs?.svg,
      orElse(asset?.logo_URIs?.png, '/logo.svg')
    ),
  };
}
