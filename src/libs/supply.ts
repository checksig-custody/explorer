import type { Coin } from '@/types';

// The parts of an asset or denom metadata that a supply row reads.
export interface SupplyAssetInfo {
  symbol?: string | undefined;
  base?: string | undefined;
  display?: string | undefined;
  logo_URIs?: { png?: string | undefined; svg?: string | undefined } | undefined;
}

export interface SupplyRow {
  denom: string;
  amount: string;
  base: string;
  info: string;
  logo: string;
}

// A denom with neither asset config nor metadata (asset is undefined) falls
// back to the coin's own denom.
export function supplyRow(coin: Coin, asset: SupplyAssetInfo | undefined, amountOf: (denom: string) => string): SupplyRow {
  const denom = asset?.symbol || coin.denom;
  const parts = denom.split('/');
  return {
    denom: (parts[parts.length - 1] ?? denom).toUpperCase(),
    amount: amountOf(denom),
    base: asset?.base || coin.denom,
    info: asset?.display || coin.denom,
    logo: asset?.logo_URIs?.svg || asset?.logo_URIs?.png || '/logo.svg',
  };
}
