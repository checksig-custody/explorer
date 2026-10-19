import { defineStore } from 'pinia';
import { get } from '@/libs/http';
import type { LoadingStatus } from '@/stores';

// Coingecko answers with numbers, keyed `<currency>` and `<currency>_24h_change`.
export type PriceMeta = Partial<Record<string, number>>;

// What the coin market chart endpoint returns: [timestamp, value] pairs.
export interface MarketChart {
  market_caps: number[][];
  prices: number[][];
  total_volumes: number[][];
}

export interface CoinTicker {
  market: {
    name: string;
    identifier: string;
  };
  coin_id: string;
  target_coin_id: string;
  trust_score: string;
  trade_url: string;
  converted_last: {
    btc: number;
    eth: number;
    usd: number;
  };
  base: string;
  target: string;
}

// What the coin endpoint returns. Coingecko can leave any part out.
export interface CoinInfo {
  name?: string;
  symbol?: string;
  description?: { en?: string };
  categories?: string[];
  market_cap_rank?: number;
  links?: {
    twitter_screen_name?: string;
    homepage?: string[];
    repos_url?: { github?: string[] };
    telegram_channel_identifier?: string;
  };
  market_data?: { price_change_percentage_24h?: number };
  tickers?: CoinTicker[];
}

const LocalStoreKey = 'currency';

export const coingeckoUrl = import.meta.env.VITE_COINGECKO_URL || 'https://api.coingecko.com';

interface CoingeckoState {
  currency: string | null; // secondary currency
  loadStatus: Record<string, LoadingStatus | undefined>;
  prices: Record<string, PriceMeta>;
  marketChart: object;
}

export const useCoingecko = defineStore('coingecko', {
  state: (): CoingeckoState => {
    const currency = localStorage.getItem(LocalStoreKey);
    return {
      currency, // secondary currency
      loadStatus: {},
      prices: {},
      marketChart: {},
    };
  },
  getters: {},

  actions: {
    getMarketChart(days = 30, coinId = 'cosmos') {
      return get(
        `${coingeckoUrl}/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${String(days)}`
      ) as Promise<MarketChart>;
    },

    fetchCoinPrice(ids: string[]) {
      const url = `${coingeckoUrl}/api/v3/simple/price?include_24hr_change=true&vs_currencies=${[
        'usd',
        this.currency,
      ].join(',')}&ids=${ids.join(',')}`;
      void get(url).then((data) => {
        this.prices = { ...this.prices, ...(data as Record<string, PriceMeta>) };
      });
    },
    getCoinInfo(coinId: string) {
      return get(`${coingeckoUrl}/api/v3/coins/${coinId}`) as Promise<CoinInfo>;
    },
    setSecondaryCurrency(currency: string) {
      if (currency !== 'usd') {
        localStorage.setItem(LocalStoreKey, currency);
        this.currency = currency;
      }
    },
  },
});
