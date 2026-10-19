import { defineStore } from 'pinia';
import { useBlockchain } from './useBlockchain';

import { get } from '@/libs/http';
import type { Validator } from '@/types';
import { CosmosRestClient } from '@/libs/client';
import {
  consensusPubkeyToHexAddress,
  pubKeyToValcons,
  valconsToBase64,
} from '@/libs';
import { toBase64, fromHex, fromBech32 } from '@cosmjs/encoding';
import { useBaseStore } from './useBaseStore';

// `params` and `pool` hold an empty object until they are fetched.
interface StakingState {
  validators: Validator[];
  params: {
    unbonding_time: string;
    max_validators: number;
    max_entries: number;
    historical_entries: number;
    bond_denom: string;
    min_commission_rate: string;
    min_self_delegation: string;
  };
  pool: {
    bonded_tokens: string;
    not_bonded_tokens: string;
  };
  keyRotation: Record<string, string>;
}

export const useStakingStore = defineStore('stakingStore', {
  state: (): StakingState => {
    return {
      validators: [],
      params: {} as StakingState['params'],
      pool: {} as StakingState['pool'],
      keyRotation: {},
    };
  },
  getters: {
    totalPower(): number {
      const sum = (s: number, e: Validator) => {
        return s + parseInt(e.delegator_shares);
      };
      return this.validators.reduce(sum, 0);
    },
    blockchain() {
      return useBlockchain();
    },
  },
  actions: {
    async init() {
      this.$reset();
      void this.fetchPool();
      void this.fetchAcitveValdiators();
      return await this.fetchParams();
    },
    async keybase(identity: string) {
      return get(`https://keybase.io/_/api/1.0/user/lookup.json?key_suffix=${identity}&fields=pictures`);
    },
    async fetchParams() {
      const response = await this.blockchain.rpcIfSet()?.getStakingParams();
      if (response?.params) this.params = response.params;
      return this.params;
    },
    async fetchPool() {
      const response = await this.blockchain.rpcIfSet()?.getStakingPool();
      if (response) {
        this.pool = response.pool;
      }
    },
    async fetchAcitveValdiators() {
      return this.fetchValidators('BOND_STATUS_BONDED', 500);
    },
    async fetchInacitveValdiators() {
      return this.fetchValidators('BOND_STATUS_UNBONDED');
    },
    async fetchUnbondingValdiators() {
      return this.fetchValidators('BOND_STATUS_UNBONDING');
    },
    async fetchValidator(validatorAddr: string) {
      return this.blockchain.rpc.getStakingValidator(validatorAddr);
    },
    async fetchValidatorDelegation(validatorAddr: string, delegatorAddr: string) {
      return await this.blockchain.rpcIfSet()?.getStakingValidatorsDelegationsDelegator(validatorAddr, delegatorAddr);
    },
    async fetchKeyRotation(chain_id: string, validatorAddr: string): Promise<string> {
      if (this.blockchain.isConsumerChain) {
        const [providerApi] = this.blockchain.current?.providerChain?.api ?? [];
        if (providerApi) {
          const signatures = useBaseStore().latest.block?.last_commit.signatures;
          if (signatures) {
            // console.log(signatures)
            const key = toBase64(fromHex(valconsToBase64(validatorAddr)));
            const exists = signatures.findIndex((x) => x.validator_address === key);
            if (exists < 0) {
              const client = CosmosRestClient.newDefault(providerApi.address);

              void client.getInterchainSecurityProviderOptedInValidators(chain_id).then((res) => {
                console.log(res);
              });
              const res = await client.getInterchainSecurityValidatorRotatedKey(chain_id, validatorAddr);
              if (res.consumer_address) {
                this.keyRotation[validatorAddr] = res.consumer_address;
                localStorage.setItem(`key-rotation-${chain_id}`, JSON.stringify(this.keyRotation));
              }
              return res.consumer_address;
            }
          }
        }
      }
      return '';
    },

    loadKeyRotationFromLocalstorage(chain_id: string) {
      const keyRotation = localStorage.getItem(`key-rotation-${chain_id}`);
      this.keyRotation = keyRotation ? (JSON.parse(keyRotation) as Record<string, string>) : {};
      return Promise.resolve();
    },

    findRotatedHexAddress(key: { '@type': string; key: string }) {
      const prefix = 'cosmos';
      const conskey = pubKeyToValcons(key, prefix);
      const rotated = this.keyRotation[conskey];
      if (rotated) {
        return valconsToBase64(rotated);
      }
      return consensusPubkeyToHexAddress(key);
    },
    async getConsumerValidators(chain_id: string) {
      const [providerApi] = this.blockchain.current?.providerChain?.api ?? [];
      if (providerApi) {
        const client = CosmosRestClient.newDefault(providerApi.address);
        await client.getStakingValidators('BOND_STATUS_BONDED', 500).then((res) => {
          this.validators = res.validators;
        });
        const id_map: Record<string, string> = { neutron: '0', stride: '1' };
        const consumer_id = Object.keys(id_map).find((k) => chain_id.startsWith(k)) || 0;
        return client.getInterchainSecurityConsumerValidators(id_map[consumer_id] ?? '');
      } else {
        return { validators: [] };
      }
    },
    fetchAllKeyRotation() {
      const vs = [];
      for (const val of this.validators) {
        const { prefix } = fromBech32(val.operator_address);
        const cons = pubKeyToValcons(val.consensus_pubkey, prefix.replace('valoper', 'valcons'));
        vs.push(cons);
      }
      return Promise.resolve();
    },
    async fetchValidators(status: string, limit = 300) {
      return this.blockchain.rpcIfSet()?.getStakingValidators(status, limit).then((res) => {
        const vals = res.validators.sort((a, b) => Number(b.delegator_shares) - Number(a.delegator_shares));
        if (status === 'BOND_STATUS_BONDED') {
          this.validators = vals;
        }
        return vals;
      });
    },
  },
});
