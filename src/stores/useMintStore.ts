import { defineStore } from 'pinia';
import { useBlockchain } from './useBlockchain';

export const useMintStore = defineStore('mintStore', {
  state: () => {
    return {
      inflation: '0',
    };
  },
  getters: {
    blockchain() {
      return useBlockchain();
    },
  },
  actions: {
    initial() {
      void this.fetchInflation();
    },
    async fetchInflation() {
      try {
        const res = await this.blockchain
          .rpcIfSet()
          ?.getMintInflation()
          .catch(() => {
            this.inflation = '0';
          });
        if (res) {
          this.inflation = res.inflation;
        }
      } catch (e) {
        console.log(e);
      }
    },
  },
});
