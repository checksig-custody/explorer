import { defineStore } from 'pinia';
import { useBlockchain } from '@/stores';
import { decodeTxRaw, type DecodedTxRaw } from '@cosmjs/proto-signing';
import dayjs from 'dayjs';
import type { Block } from '@/types';
import { hashTx } from '@/libs';
import { fromBase64 } from '@cosmjs/encoding';

const FETCH_ALL_BLOCKS = import.meta.env.VITE_FETCH_ALL_BLOCKS || false;
const RECENT_BLOCKS_LIMIT = import.meta.env.VITE_RECENT_BLOCK_LIMIT || 50;

// Until the first fetch the store holds an empty object where a block will be.
interface BaseState {
  earliest: Partial<Block>;
  latest: Partial<Block>;
  recents: Block[];
  theme: 'light' | 'dark';
  connected: boolean;
}

export const useBaseStore = defineStore('baseStore', {
  state: (): BaseState => {
    return {
      earliest: {},
      latest: {},
      recents: [],
      theme: (window.localStorage.getItem('theme') || 'dark') as
        'light' | 'dark',
      connected: false,
    };
  },
  getters: {
    blocktime(): number {
      const latest = this.latest.block;
      const earliest = this.earliest.block;
      if (
        latest &&
        earliest &&
        latest.header.height !== earliest.header.height
      ) {
        const diff = dayjs(latest.header.time).diff(earliest.header.time);
        const blocks =
          Number(latest.header.height) - Number(earliest.header.height);
        return Math.round(diff / blocks);
      }
      return 1000; // better to start low and increase
    },
    blockchain() {
      return useBlockchain();
    },
    hasRpc(): boolean {
      return this.blockchain.rpc as unknown as boolean;
    },
    currentChainId(): string {
      return this.latest.block?.header.chain_id || '';
    },
    txsInRecents() {
      const txs: {
        height: string;
        hash: string;
        tx: DecodedTxRaw;
      }[] = [];
      this.recents.forEach((b) => {
        b.block.data?.txs.forEach((tx: string) => {
          if (tx) {
            const raw = fromBase64(tx);
            try {
              txs.push({
                height: b.block.header.height,
                hash: hashTx(raw),
                tx: decodeTxRaw(raw),
              });
            } catch (e) {
              console.error(e);
            }
          }
        });
      });
      return txs.sort((a, b) => {
        return Number(b.height) - Number(a.height);
      });
    },
  },
  actions: {
    async initial() {
      while (!this.hasRpc) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      void this.fetchLatest();
    },
    clearRecentBlocks() {
      this.recents = [];
      return Promise.resolve();
    },
    async fetchLatest() {
      if (!this.hasRpc) return this.latest;
      try {
        this.latest = await this.blockchain.rpc.getBaseBlockLatest();
        this.connected = true;
      } catch (error) {
        console.error('Error fetching latest block:', error);
        this.connected = false;
      }
      if (
        this.earliest.block?.header.chain_id !=
        this.latest.block?.header.chain_id
      ) {
        //reset earliest and recents
        this.earliest = this.latest;
        this.recents = [];
      }
      //check if the block exists in recents
      if (
        this.recents.findIndex(
          (x) => x.block_id.hash === this.latest.block_id?.hash
        ) === -1
      ) {
        const newBlocks = await this.fetchNewBlocks();
        const combined = [...this.recents, ...newBlocks];
        this.recents = combined.slice(-RECENT_BLOCKS_LIMIT);
      }
      return this.latest;
    },
    /**
     * Fetches all blocks since the last block in recents.
     * Only fetches blocks with height greater than this.recents[-1].block.header.height.
     * Returns an array of new blocks to be added to recents.
     */
    async fetchNewBlocks(): Promise<Block[]> {
      const latest = this.latest;
      if (!latest.block?.header.height) return [];
      if (!FETCH_ALL_BLOCKS) return [latest as Block];
      const oldHeight = Number(
        this.recents[this.recents.length - 1]?.block.header.height
      );
      const newHeight = Number(latest.block.header.height);
      const newBlocks: Block[] = [];
      // Fetch all blocks between oldHeight+1 and less than newHeight
      for (let h = oldHeight + 1; h < newHeight; h++) {
        const block = await this.fetchBlock(h);
        if (!block.block?.header.height) continue; // skip if block not found
        newBlocks.push(block as Block);
      }
      // Add the latest block
      newBlocks.push(latest as Block);
      return newBlocks;
    },
    async fetchValidatorByHeight(height?: number, offset = 0) {
      return this.blockchain.rpc.getBaseValidatorsetAt(String(height), offset);
    },
    async fetchLatestValidators(offset = 0) {
      return this.blockchain.rpc.getBaseValidatorsetLatest(offset);
    },
    async fetchBlock(height?: number | string): Promise<Partial<Block>> {
      try {
        const block = await this.blockchain.rpc.getBaseBlockAt(String(height));
        this.connected = true;
        return block;
      } catch (error) {
        console.error('Error fetching latest block:', error);
        this.connected = false;
      }
      return {};
    },
    async fetchAbciInfo() {
      return this.blockchain.rpc.getBaseNodeInfo();
    },
    // async fetchNodeInfo() {
    //     return this.blockchain.rpc.no()
    // }
  },
});
