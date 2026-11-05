import { defineStore } from 'pinia';
import { useBlockchain } from './useBlockchain';

interface DistributionState {
  params: {
    community_tax: string;
    base_proposer_reward: string;
    bonus_proposer_reward: string;
    withdraw_addr_enabled: boolean;
  };
}

export const useDistributionStore = defineStore('distributionStore', {
  state: (): DistributionState => {
    return {
      params: {} as DistributionState['params'],
    };
  },
  getters: {
    blockchain() {
      return useBlockchain();
    },
  },
  actions: {
    initial() {
      void this.fetchParams();
    },
    async fetchParams() {
      const response = await this.blockchain
        .rpcIfSet()
        ?.getDistributionParams();
      if (response?.params) this.params = response.params;
      return this.params;
    },
    async fetchCommunityPool() {
      return this.blockchain.rpcIfSet()?.getDistributionCommunityPool();
    },
  },
});
