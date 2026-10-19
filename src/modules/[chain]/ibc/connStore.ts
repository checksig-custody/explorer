import { defineStore } from 'pinia';

import { useBlockchain } from '@/stores';
import { ChainRegistryClient } from '@chain-registry/client';
import type { IBCData } from '@chain-registry/types/ibc_data.schema';
import router from '@/router';
import fetch from 'cross-fetch';

const IBC_USE_GITHUB_API = import.meta.env.VITE_IBC_USE_GITHUB_API === 'true';
const PINGPUB_API_URL =
  import.meta.env.VITE_PINGPUB_API_URL || 'https://registry.ping.pub';
const GITHUB_API_URL =
  import.meta.env.VITE_GITHUB_API_URL ||
  'https://api.github.com/repos/cosmos/chain-registry/contents';
const IBC_API_URL = IBC_USE_GITHUB_API ? GITHUB_API_URL : PINGPUB_API_URL;

// An entry of the registry's _IBC directory listing.
interface IbcUrlEntry {
  name: string;
  download_url?: string;
}

export const useIBCModule = defineStore('module-ibc', {
  state: () => {
    return {
      info: [] as IBCData[],
      connectionId: '',
      registryConf: {} as IBCData,
    };
  },
  getters: {
    chain() {
      return useBlockchain();
    },
    chainName(): string {
      return this.chain.chainName;
    },
    isFirstChain(): boolean {
      return (
        this.registryConf.chain_1.chain_name ===
          this.chain.current?.prettyName ||
        this.registryConf.chain_1.chain_name === this.chain.chainName
      );
    },
    sourceField(): string {
      return this.isFirstChain ? 'chain_1' : 'chain_2';
    },
    destField(): string {
      return this.isFirstChain ? 'chain_2' : 'chain_1';
    },
    registryChannels(): IBCData['channels'] {
      return this.registryConf.channels;
    },
  },
  actions: {
    load() {
      const prefix = this.chain.current?.networkType?.includes('testnet')
        ? 'testnets/'
        : '';
      const client = new ChainRegistryClient({
        chainNames: [this.chainName],
        ...(IBC_USE_GITHUB_API
          ? {}
          : { baseUrl: new URL(prefix, PINGPUB_API_URL + '/').toString() }),
      });
      void this.fetchIBCUrls().then((res) => {
        res.forEach((element) => {
          if (element.download_url) {
            client.urls.push(element.download_url);
          }
        });
        void client.fetchUrls().then(() => {
          const info = client.getChainIbcData(this.chainName);
          this.info = info.sort((a, b) => {
            // Sort by remote chain name (not equal to this.chainName)
            const getRemote = (x: IBCData) =>
              x.chain_1.chain_name === this.chain.current?.prettyName ||
              x.chain_1.chain_name === this.chain.chainName
                ? x.chain_2.chain_name
                : x.chain_1.chain_name;
            return getRemote(a).localeCompare(getRemote(b));
          });
        });
      });
    },
    async fetchIBCUrls(): Promise<IbcUrlEntry[]> {
      const prefix = this.chain.current?.networkType?.includes('testnet')
        ? 'testnets/'
        : '';
      const ibcEndpoint = new URL(
        `${prefix}_IBC`,
        IBC_API_URL + '/'
      ).toString();
      console.log('Fetching IBC URLs from:', IBC_API_URL);
      const entries = await fetch(ibcEndpoint)
        .then((res) => res.json() as Promise<unknown>)
        .then((data) =>
          Array.isArray(data)
            ? (data as IbcUrlEntry[]).filter((x) =>
                RegExp(this.chainName).exec(x.name)
              )
            : []
        );

      // If using PINGPUB_API_URL, add thedownload URLs
      if (IBC_API_URL == PINGPUB_API_URL) {
        return entries.map((entry) => {
          entry.download_url = new URL(
            `${prefix}_IBC/${entry.name}`,
            PINGPUB_API_URL + '/'
          ).toString();
          return entry;
        });
      }
      return entries;
    },
    fetchConnection(index: number) {
      // An index with no entry sets registryConf to undefined, and the next
      // line throws a TypeError, as before.
      this.registryConf = this.info[index] as unknown as IBCData;
      const connId = this.isFirstChain
        ? this.registryConf.chain_1.connection_id
        : this.registryConf.chain_2.connection_id;
      this.showConnection(connId);
    },
    showConnection(connId?: string | number) {
      if (!connId) {
        this.registryConf = {} as IBCData;
      }
      const path = `/${this.chain.chainName}/ibc/connection/${String(connId || `connection-${String(this.connectionId || 0)}`)}`;
      void router.push(path);
    },
  },
});
