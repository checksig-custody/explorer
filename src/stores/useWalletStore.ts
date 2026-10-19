import { defineStore } from 'pinia';
import { useBlockchain } from './useBlockchain';
import { fromBech32, toBech32 } from '@cosmjs/encoding';
import type {
  Delegation,
  Coin,
  UnbondingResponses,
  DelegatorRewards,
  WalletConnected,
} from '@/types';
import { useStakingStore } from './useStakingStore';
import router from '@/router';

interface WalletState {
  balances: Coin[];
  delegations: Delegation[];
  unbonding: UnbondingResponses[];
  rewards: DelegatorRewards;
  // An empty object until a wallet is connected.
  wallet: Partial<WalletConnected>;
}

export const useWalletStore = defineStore('walletStore', {
  state: (): WalletState => {
    return {
      balances: [],
      delegations: [],
      unbonding: [],
      rewards: { total: [], rewards: [] },
      wallet: {},
    };
  },
  getters: {
    blockchain() {
      return useBlockchain();
    },
    connectedWallet(): Partial<WalletConnected> {
      if (this.wallet.cosmosAddress) return this.wallet;
      const chainStore = useBlockchain();
      const key = chainStore.defaultHDPath;
      const connected = JSON.parse(
        localStorage.getItem(key) || '{}'
      ) as Partial<WalletConnected>;
      return connected;
    },
    balanceOfStakingToken(): Coin {
      const stakingStore = useStakingStore();
      return (
        this.balances.find(
          (x) => x.denom === stakingStore.params.bond_denom
        ) ?? {
          amount: '0',
          denom: stakingStore.params.bond_denom,
        }
      );
    },
    stakingAmount(): Coin {
      const stakingStore = useStakingStore();
      let amt = 0;
      let denom = stakingStore.params.bond_denom;
      this.delegations.forEach((i) => {
        amt += Number(i.balance.amount);
        denom = i.balance.denom;
      });
      return { amount: String(amt), denom };
    },
    rewardAmount(): Coin {
      const stakingStore = useStakingStore();
      const reward = this.rewards.total.find(
        (x) => x.denom === stakingStore.params.bond_denom
      );
      return reward ?? { amount: '0', denom: stakingStore.params.bond_denom };
    },
    unbondingAmount(): Coin {
      let amt = 0;
      this.unbonding.forEach((i) => {
        i.entries.forEach((e) => {
          amt += Number(e.balance);
        });
      });

      const stakingStore = useStakingStore();
      return { amount: String(amt), denom: stakingStore.params.bond_denom };
    },
    currentAddress(): string {
      if (!this.connectedWallet.cosmosAddress) return '';
      const { prefix, data } = fromBech32(this.connectedWallet.cosmosAddress);
      const chainStore = useBlockchain();
      return toBech32(chainStore.current?.bech32Prefix || prefix, data);
    },
    shortAddress(): string {
      const address: string = this.currentAddress;
      if (address.length > 4) {
        return address.substring(address.length - 4);
      }
      return '';
    },
  },
  actions: {
    loadMyAsset() {
      if (!this.currentAddress) return;
      void this.blockchain.rpc
        .getBankBalances(this.currentAddress)
        .then((x) => {
          this.balances = x.balances;
        });
      void this.blockchain.rpc
        .getStakingDelegations(this.currentAddress)
        .then((x) => {
          this.delegations = x.delegation_responses;
        });
      void this.blockchain.rpc
        .getStakingDelegatorUnbonding(this.currentAddress)
        .then((x) => {
          this.unbonding = x.unbonding_responses;
        });
      void this.blockchain.rpc
        .getDistributionDelegatorRewards(this.currentAddress)
        .then((x) => {
          this.rewards = x;
        });
    },
    myBalance() {
      return this.blockchain.rpc.getBankBalances(this.currentAddress);
    },
    myDelegations() {
      return this.blockchain.rpc.getStakingDelegations(this.currentAddress);
    },
    myUnbonding() {
      return this.blockchain.rpc.getStakingDelegatorUnbonding(
        this.currentAddress
      );
    },
    disconnect() {
      const chainStore = useBlockchain();
      const key = chainStore.defaultHDPath;
      localStorage.removeItem(key);
      this.$reset();
    },
    setConnectedWallet(value: WalletConnected | undefined) {
      if (value) this.wallet = value;
    },
    suggestChain() {
      if (window.location.pathname === '/SIDE-Testnet') {
        void router.push({ path: '/wallet/unisat' });
      } else {
        void router.push({ path: '/wallet/keplr' });
      }
    },
  },
});
