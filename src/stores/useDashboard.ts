import { defineStore } from 'pinia';
import { get } from '@/libs/http';
import type { ChainConfig, DirectoryChainConfig, Endpoint, LocalChainConfig } from '@/types/chaindata';
import { ConfigSource, NetworkType } from '@/types/chaindata';
import { useBlockchain } from './useBlockchain';
import { coingeckoUrl, type PriceMeta } from '@/stores';

// The chain files give each endpoint list as strings or as endpoint objects.
function apiConverter(api: string | (string | Endpoint)[] | undefined): Endpoint[] {
  if (!api) return [];
  const array = typeof api === 'string' ? [api] : api;
  return array.map((x) => {
    if (typeof x === 'string') {
      const parts = x.split('.');
      return {
        address: x,
        provider: (parts.length >= 2 ? parts[parts.length - 2] : x) ?? x,
      };
    } else {
      return x;
    }
  });
}

export function convertFromLocal(lc: LocalChainConfig): ChainConfig {
  const conf = {} as ChainConfig;
  conf.assets = lc.assets.map((x) => ({
    name: x.base,
    base: x.base,
    display: x.symbol,
    symbol: x.symbol,
    logo_URIs: { svg: x.logo },
    coingecko_id: x.coingecko_id,
    exponent: x.exponent,
    denom_units: [
      { denom: x.base, exponent: 0 },
      { denom: x.symbol.toLowerCase(), exponent: Number(x.exponent) },
    ],
    type_asset: 'sdk.coin',
  }));
  conf.versions = {
    cosmosSdk: lc.sdk_version,
  };
  conf.bech32Prefix = lc.addr_prefix;
  conf.bech32ConsensusPrefix = lc.consensus_prefix ?? `${lc.addr_prefix}valcons`;
  conf.chainName = lc.chain_name;
  conf.networkType = lc.network_type;
  conf.coinType = lc.coin_type;
  conf.prettyName = lc.registry_name || lc.chain_name;
  conf.endpoints = {
    rest: apiConverter(lc.api),
    rpc: apiConverter(lc.rpc),
    grpc: apiConverter(lc.grpc),
  };
  if (lc.provider_chain) {
    conf.providerChain = {
      api: apiConverter(lc.provider_chain.api),
    };
  }
  conf.features = lc.features;
  conf.logo = lc.logo.startsWith('http') || lc.logo.startsWith('/') ? lc.logo : `https://ping.pub${lc.logo}`;
  conf.keplrFeatures = lc.keplr_features;
  conf.keplrPriceStep = lc.keplr_price_step;
  conf.themeColor = lc.theme_color;
  conf.faucet = lc.faucet;
  return conf;
}

export function convertFromDirectory(source: DirectoryChainConfig): ChainConfig {
  const conf = {} as ChainConfig;
  conf.assets = source.assets;
  conf.bech32Prefix = source.bech32_prefix;
  conf.bech32ConsensusPrefix = `${source.bech32_prefix}valcons`;
  conf.chainId = source.chain_id;
  conf.chainName = source.chain_name;
  conf.prettyName = source.pretty_name;
  conf.networkType = source.network_type;
  conf.versions = {
    application: source.versions?.application_version || '',
    cosmosSdk: source.versions?.cosmos_sdk_version || '',
    tendermint: source.versions?.tendermint_version || '',
  };
  conf.logo = pathConvert(source.image);
  conf.endpoints = source.best_apis;
  return conf;
}

function pathConvert(path: string | undefined) {
  if (path) {
    path = path.replace('https://raw.githubusercontent.com/cosmos/chain-registry/master', 'https://registry.ping.pub');
  }
  return path || '';
}

export function getLogo(
  conf:
    | {
        svg?: string;
        png?: string;
        jpeg?: string;
      }
    | undefined
) {
  if (conf) {
    return pathConvert(conf.svg || conf.png || conf.jpeg);
  }
  return undefined;
}

// Unused function, kept for reference
// function createChainFromDirectory(source: DirectoryChain): ChainConfig {
//   const conf = {} as ChainConfig;
//   conf.apis = source.best_apis;
//   conf.bech32_prefix = source.bech32_prefix;
//   conf.chain_id = source.chain_id;
//   conf.chain_name = source.chain_name;
//   conf.explorers = source.explorers;
//   conf.pretty_name = source.pretty_name;
//   if (source.versions) {
//     conf.codebase = {
//       recommended_version: source.versions.application_version,
//       cosmos_sdk_version: source.versions.cosmos_sdk_version,
//       tendermint_version: source.versions.tendermint_version,
//     };
//   }
//   if (source.image) {
//     conf.logo_URIs = {
//       svg: source.image,
//     };
//   }
//   return conf;
// }

export enum LoadingStatus {
  Empty,
  Loading,
  Loaded,
}

interface DashboardState {
  status: LoadingStatus;
  source: ConfigSource;
  networkType: NetworkType;
  favoriteMap: Record<string, boolean>;
  chains: Record<string, ChainConfig>;
  prices: Record<string, PriceMeta>;
  coingecko: Record<string, { coinId: string; exponent: number; symbol: string }>;
}

export const useDashboard = defineStore('dashboard', {
  state: (): DashboardState => {
    const favMap = JSON.parse(localStorage.getItem('favoriteMap') || '{"cosmos":true, "osmosis":true}') as Record<
      string,
      boolean
    >;
    return {
      status: LoadingStatus.Empty,
      source: ConfigSource.MainnetCosmosDirectory,
      networkType: NetworkType.Mainnet,
      favoriteMap: favMap,
      chains: {},
      prices: {},
      coingecko: {},
    };
  },
  getters: {
    length(): number {
      return Object.keys(this.chains).length;
    },
  },
  actions: {
    async initial() {
      await this.loadingFromLocal();
      //await this.loadingFromRegistry()
    },
    loadingPrices() {
      const coinIds = [] as string[];
      const keys = Object.keys(this.chains); // load all blockchain
      // Object.keys(this.favoriteMap) //only load favorite once it has too many chains
      keys.forEach((k) => {
        if (Array.isArray(this.chains[k]?.assets))
          this.chains[k].assets.forEach((a) => {
            if (a.coingecko_id !== undefined && a.coingecko_id.length > 0) {
              coinIds.push(a.coingecko_id);
              a.denom_units.forEach((u) => {
                this.coingecko[u.denom] = {
                  coinId: a.coingecko_id ?? '',
                  exponent: u.exponent,
                  symbol: a.symbol,
                };
              });
            }
          });
      });

      const currencies = ['usd, cny']; // usd,cny,eur,jpy,krw,sgd,hkd
      void get(
        `${coingeckoUrl}/api/v3/simple/price?include_24hr_change=true&vs_currencies=${currencies.join(
          ','
        )}&ids=${coinIds.join(',')}`
      ).then((x) => {
        this.prices = x as Record<string, PriceMeta>;
      });
    },
    loadingFromRegistry() {
      if (this.status === LoadingStatus.Empty) {
        this.status = LoadingStatus.Loading;
        void get(this.source).then((res) => {
          (res as { chains: DirectoryChainConfig[] }).chains.forEach((x: DirectoryChainConfig) => {
            this.chains[x.chain_name] = convertFromDirectory(x);
          });
          this.status = LoadingStatus.Loaded;
        });
      }
      return Promise.resolve();
    },
    loadingFromLocal() {
      if (window.location.hostname.search('testnet') > -1) {
        this.networkType = NetworkType.Testnet;
      }
      const source =
        this.networkType === NetworkType.Mainnet
          ? import.meta.glob<LocalChainConfig>('../../chains/mainnet/*.json', { eager: true })
          : import.meta.glob<LocalChainConfig>('../../chains/testnet/*.json', { eager: true });
      Object.values(source).forEach((x) => {
        const chain = convertFromLocal(x);
        if (!chain.networkType) {
          chain.networkType = this.networkType.toString().toLowerCase();
        }
        this.chains[x.chain_name] = chain;
      });
      this.setupDefault();
      this.status = LoadingStatus.Loaded;
      return Promise.resolve();
    },
    loadLocalConfig(network: NetworkType) {
      const config: Record<string, ChainConfig> = {};
      const source =
        network === NetworkType.Mainnet
          ? import.meta.glob<LocalChainConfig>('../../chains/mainnet/*.json', { eager: true })
          : import.meta.glob<LocalChainConfig>('../../chains/testnet/*.json', { eager: true });
      Object.values(source).forEach((x) => {
        const chain = convertFromLocal(x);
        if (!chain.networkType) {
          chain.networkType = network.toString().toLowerCase();
        }
        config[x.chain_name] = chain;
      });
      return Promise.resolve(config);
    },
    setupDefault() {
      if (this.length > 0) {
        const blockchain = useBlockchain();
        const keys = Object.keys(this.favoriteMap);
        for (const key of keys) {
          if (!blockchain.chainName && this.chains[key] && this.favoriteMap[key]) {
            void blockchain.setCurrent(key);
            break;
          }
        }
        if (!blockchain.chainName) {
          const [first] = Object.keys(this.chains);
          if (first !== undefined) void blockchain.setCurrent(first);
        }
        this.loadingPrices();
      }
    },
    setConfigSource(newSource: ConfigSource) {
      this.source = newSource;
      void this.initial();
    },
  },
});
