import {
  useBlockchain,
  useCoingecko,
  useBaseStore,
  useBankStore,
  useFormatter,
  useGovStore,
  useDistributionStore,
  useMintStore,
  useStakingStore,
} from '@/stores';
import type { Coin, Tally } from '@/types';
import type { CoinInfo, MarketChart } from '@/stores/useCoinGecko';
import { defined, maybe, orDefault } from '@/libs/utils';
import numeral from 'numeral';
import { defineStore } from 'pinia';

export function colorMap(color: string) {
  switch (color) {
    case 'yellow':
      return 'warning';
    case 'green':
      return 'success';
    default:
      return 'secondary';
  }
}

const CODEMAP: Record<string, [string, string]> = {
  'binance.com': ['ref', 'CPA_004JZGRX6A'],
  'gate.com': ['ref', 'U1gVBl9a'],
  bybit: ['affiliate_id', 'JKRRZX9'],
};

interface Stat {
  title: string;
  color: string;
  icon: string;
  stats: string;
  change: number;
}

interface IndexState {
  days: number;
  tickerIndex: number;
  coinInfo: CoinInfo;
  marketData: MarketChart;
  // undefined when the pool was fetched with no endpoint set
  communityPool: Coin[] | undefined;
  tally: Record<string, Tally>;
}

export const useIndexModule = defineStore('module-index', {
  state: (): IndexState => {
    return {
      days: 14,
      tickerIndex: 0,
      coinInfo: {
        name: '',
        symbol: '',
        description: {
          en: '',
        },
        categories: [],
        market_cap_rank: 0,
        links: {
          twitter_screen_name: '',
          homepage: [],
          repos_url: {
            github: [],
          },
          telegram_channel_identifier: '',
        },
        market_data: {
          price_change_percentage_24h: 0,
        },
        tickers: [],
      },
      marketData: {
        market_caps: [],
        prices: [],
        total_volumes: [],
      },
      communityPool: [],
      tally: {},
    };
  },
  getters: {
    blockchain() {
      const chain = useBlockchain();
      return chain.current;
    },
    coingecko() {
      return useCoingecko();
    },
    bankStore() {
      return useBankStore();
    },
    twitter(): string {
      if (!this.coinInfo.links?.twitter_screen_name) return '';
      return `https://twitter.com/${this.coinInfo.links.twitter_screen_name}`;
    },
    homepage(): string | undefined {
      if (!this.coinInfo.links?.homepage) return '';
      const [page1, page2, page3] = this.coinInfo.links.homepage;
      return orDefault(orDefault(page1, page2), page3);
    },
    github(): string | undefined {
      if (!this.coinInfo.links?.repos_url) return '';
      const [page1, page2, page3] = this.coinInfo.links.repos_url.github ?? [];
      return orDefault(orDefault(page1, page2), page3);
    },
    telegram(): string {
      if (!this.coinInfo.links?.homepage) return '';
      return `https://t.me/${String(this.coinInfo.links.telegram_channel_identifier)}`;
    },

    priceChange(): string {
      if (!this.coinInfo.market_data?.price_change_percentage_24h) return '';
      const change = this.coinInfo.market_data.price_change_percentage_24h;
      return numeral(change).format('+0.[00]');
    },

    priceColor(): string {
      if (!this.coinInfo.market_data?.price_change_percentage_24h) return '';
      const change = this.coinInfo.market_data.price_change_percentage_24h;
      switch (true) {
        case change > 0:
          return 'text-success';
        case change < 0:
          return 'text-error';
        default:
          return '';
      }
    },
    trustColor(): string | undefined {
      if (!this.coinInfo.tickers) return '';
      const change = this.coinInfo.tickers[this.tickerIndex]?.trust_score;
      return change;
    },

    pool(): { bonded_tokens: string; not_bonded_tokens: string } {
      const staking = useStakingStore();
      return staking.pool;
    },

    proposals() {
      const gov = useGovStore();
      return gov.proposals['2'];
    },

    stats(): Stat[] {
      const base = useBaseStore();
      const bank = useBankStore();
      const staking = useStakingStore();
      const mintStore = useMintStore();
      const formatter = useFormatter();

      return [
        {
          title: 'Height',
          color: 'primary',
          icon: 'mdi-pound',
          stats: String(orDefault(base.latest.block?.header.height, 0)),
          change: 0,
        },
        {
          title: 'Validators',
          color: 'error',
          icon: 'mdi-human-queue',
          stats: String(
            orDefault(base.latest.block?.last_commit?.signatures.length, 0)
          ),
          change: 0,
        },
        {
          title: 'Supply',
          color: 'success',
          icon: 'mdi-currency-usd',
          stats: formatter.formatTokenAmount(bank.supply),
          change: 0,
        },
        {
          title: 'Bonded Tokens',
          color: 'warning',
          icon: 'mdi-lock',
          stats: formatter.formatTokenAmount({
            amount: this.pool.bonded_tokens,
            denom: staking.params.bond_denom,
          }),
          change: 0,
        },
        {
          title: 'Inflation',
          color: 'success',
          icon: 'mdi-chart-multiple',
          stats: formatter.formatDecimalToPercent(mintStore.inflation),
          change: 0,
        },
        {
          title: 'Community Pool',
          color: 'primary',
          icon: 'mdi-bank',
          stats: formatter.formatTokens(
            this.communityPool?.filter(
              (x) => x.denom === staking.params.bond_denom
            )
          ),
          change: 0,
        },
      ];
    },

    coingeckoId(): string | undefined {
      this.tickerIndex = 0;
      const [firstAsset] = this.blockchain?.assets ?? [];
      return defined(firstAsset, 'coingecko_id').coingecko_id;
    },
  },
  actions: {
    // async as on master: a throw below is a rejection, not a throw in the caller
    // eslint-disable-next-line @typescript-eslint/require-await -- see above
    async loadDashboard() {
      this.$reset();
      this.initCoingecko();
      void useMintStore().fetchInflation();
      void useDistributionStore()
        .fetchCommunityPool()
        .then((x) => {
          this.communityPool = maybe(x?.pool)
            ?.filter((t) => t.denom.length < 10)
            .map((t) => ({
              amount: String(parseInt(t.amount)),
              denom: t.denom,
            }));
        });
      // const gov = useGovStore();
      // gov.fetchProposals('2').then((x) => {
      //   this.proposals = x;
      // });
    },
    tickerColor(color: string) {
      return colorMap(color);
    },
    initCoingecko() {
      this.tickerIndex = 0;
      const [firstAsset] = this.blockchain?.assets ?? [];
      if (firstAsset?.coingecko_id) {
        void this.coingecko.getCoinInfo(firstAsset.coingecko_id).then((x) => {
          this.coinInfo = x;
          // this.coinInfo.tickers.sort((a, b) => a.converted_last.usd - b.converted_last.usd)
        });
        void this.coingecko
          .getMarketChart(this.days, firstAsset.coingecko_id)
          .then((x) => {
            this.marketData = x;
          });
      }
    },
    selectTicker(i: number) {
      this.tickerIndex = i;
    },
  },
});

/**
 * Adds or replaces a query parameter in the provided URL.
 * @param url - The base URL.
 * @param param - The name of the parameter to add or replace.
 * @param value - The value to set for the parameter.
 * @returns The new URL with the parameter added or replaced.
 */
export function addOrReplaceUrlParam(
  url: string,
  param: string,
  value: string
): string {
  // Parse the URL
  const urlObj = new URL(url, window.location.origin);

  // Set (add or replace) the query parameter
  urlObj.searchParams.set(param, value);

  // Return the string representation of the new URL
  return urlObj.toString();
}

export function tickerUrl(url: string) {
  for (const [domain, [param, value]] of Object.entries(CODEMAP)) {
    if (url.includes(domain)) {
      return addOrReplaceUrlParam(url, param, value);
    }
  }
  return url;
}
