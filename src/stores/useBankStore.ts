import { defineStore } from 'pinia';

import { useBlockchain } from './useBlockchain';
import { useStakingStore } from './useStakingStore';
import type { Coin, DenomTrace } from '@/types';

interface BankState {
  // An empty object until the supply is fetched.
  supply: Coin;
  balances: Record<string, Coin[]>;
  totalSupply: { supply: Coin[] };
  ibcDenoms: Record<string, DenomTrace>;
}

export const useBankStore = defineStore('bankstore', {
  state: (): BankState => {
    return {
      supply: {} as Coin,
      balances: {},
      totalSupply: { supply: [] },
      ibcDenoms: {},
    };
  },
  getters: {
    blockchain() {
      return useBlockchain();
    },
    staking() {
      return useStakingStore();
    },
  },
  actions: {
    initial() {
      this.$reset();
      this.supply = {} as Coin;
      const denom = this.staking.params.bond_denom || this.blockchain.current?.assets[0]?.base;
      if (denom) {
        void this.blockchain.rpc.getBankSupplyByDenom(denom).then((res) => {
          if (res.amount) this.supply = res.amount;
        });
      }
    },
    async fetchSupply(denom: string) {
      return this.blockchain.rpc.getBankSupplyByDenom(denom);
    },
    async fetchDenomTrace(denom: string) {
      const hash = denom.replace('ibc/', '');
      let trace = this.ibcDenoms[hash];
      if (!trace) {
        trace = (await this.blockchain.rpc.getIBCAppTransferDenom(hash)).denom_trace;
        this.ibcDenoms[hash] = trace;
      }
      return trace;
    },
  },
});
