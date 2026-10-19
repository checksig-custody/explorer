import { defineStore } from 'pinia';
import { useBlockchain } from './useBlockchain';
import { percent, formatNumber, formatTokenAmount } from '@/libs/utils';
export interface stakingItem {
  unbonding_time: string;
  max_validators: number;
  max_entries: number;
  historical_entries: number;
  bond_denom: string;
  min_commission_rate: string;
  min_self_delegation: string;
}

export interface ParamItem {
  subtitle: string;
  value: unknown;
}

// Object.entries types the values of an interface as any.
function paramItems(params: object): ParamItem[] {
  return Object.entries(params).map(([key, value]: [string, unknown]) => ({
    subtitle: key,
    value,
  }));
}

export interface ParamCard {
  title: string;
  items: ParamItem[];
}

interface ParamState {
  latestTime: string;
  chain: {
    title: string;
    class: string;
    items: { subtitle: string; icon: string; color: string; value: string }[];
  };
  mint: ParamCard;
  staking: ParamCard;
  distribution: ParamCard;
  slashing: ParamCard;
  gov: ParamCard;
  appVersion: ParamCard;
  nodeVersion: ParamCard;
}

export const useParamStore = defineStore('paramstore', {
  state: (): ParamState => ({
    latestTime: '',
    chain: {
      title: '',
      class: 'border-primary',
      items: [
        {
          subtitle: 'height',
          icon: 'BoxIcon',
          color: 'light-success',
          value: '-',
        },
        {
          subtitle: 'bonded_and_supply',
          icon: 'DollarSignIcon',
          color: 'light-danger',
          value: '-',
        },
        {
          subtitle: 'bonded_ratio',
          icon: 'PercentIcon',
          color: 'light-warning',
          value: '-',
        },
        {
          subtitle: 'inflation',
          icon: 'TrendingUpIcon',
          color: 'light-primary',
          value: '-',
        },
      ],
    },
    mint: {
      title: 'Mint Parameters',
      items: [],
    },
    staking: {
      title: 'Staking Parameters',
      items: [],
    },
    distribution: {
      title: 'Distribution Parameters',
      items: [],
    },
    slashing: {
      title: 'Slashing Parameters',
      items: [],
    },
    gov: {
      title: 'Governance Parameters',
      items: [],
    },
    appVersion: {
      title: 'Application Version',
      items: [],
    },
    nodeVersion: {
      title: 'Node Information',
      items: [],
    },
  }),
  getters: {
    blockchain() {
      return useBlockchain();
    },
  },
  actions: {
    initial() {
      void this.handleBaseBlockLatest();
      // this.handleMintParam()
      void this.handleStakingParams();
      void this.handleSlashingParams();
      void this.handleDistributionParams();
      this.handleGovernanceParams();
      void this.handleAbciInfo();
    },
    async handleBaseBlockLatest() {
      try {
        const res = await this.getBaseTendermintBlockLatest();
        const height = this.chain.items.find((x) => x.subtitle === 'height');
        this.chain.title = `Chain ID: ${res.block.header.chain_id}`;
        if (height) height.value = res.block.header.height;
        // if (timeIn(res.block.header.time, 3, 'm')) {
        //   this.syncing = true
        // } else {
        //   this.syncing = false
        // }
        // this.latestTime = toDay(res.block.header.time, 'long')
        this.latestTime = res.block.header.time;
      } catch (error) {
        console.warn(error);
      }
    },
    async handleStakingParams() {
      const res = await this.getStakingParams();
      const bond_denom = res.params.bond_denom;
      this.staking.items = paramItems(res.params).filter(
        (item) =>
          !['min_commission_rate', 'min_self_delegation'].includes(
            item.subtitle
          )
      );
      void Promise.all([
        this.getStakingPool(),
        this.getBankTotal(bond_denom),
      ]).then(([poolRes, supplyRes]) => {
        const pool = poolRes.pool;
        const amount = supplyRes.amount?.amount;
        const assets = this.blockchain.current?.assets;
        if (!assets) return;
        const bondedAndSupply = this.chain.items.find(
          (x) => x.subtitle === 'bonded_and_supply'
        );
        if (bondedAndSupply)
          bondedAndSupply.value = `${String(
            formatNumber(
              Number(
                formatTokenAmount(
                  assets,
                  pool.bonded_tokens,
                  2,
                  bond_denom,
                  false
                )
              ),
              true,
              0
            )
          )}/${String(formatNumber(Number(formatTokenAmount(assets, amount, 2, bond_denom, false)), true, 0))}`;
        const bondedRatio = this.chain.items.find(
          (x) => x.subtitle === 'bonded_ratio'
        );
        if (bondedRatio)
          bondedRatio.value = `${String(percent(Number(pool.bonded_tokens) / Number(amount)))}%`;
      });
    },
    async handleMintParam() {
      const excludes = this.blockchain.current?.excludes;
      if (excludes?.includes('mint')) {
        return;
      }
      // this.getMintingInflation().then(res => {
      //     const chainIndex = this.chain.items.findIndex(x => x.subtitle === 'inflation')
      //     this.chain.items[chainIndex].value = `${percent(res)}%`
      // })
      await this.getMintParam();
    },
    async handleSlashingParams() {
      const res = await this.getSlashingParams();
      this.slashing.items = paramItems(res.params);
    },
    async handleDistributionParams() {
      const res = await this.getDistributionParams();
      this.distribution.items = paramItems(res.params);
    },
    handleGovernanceParams() {
      const excludes = this.blockchain.current?.excludes;
      if (excludes?.includes('governance')) {
        return;
      }
      void Promise.all([
        this.getGovParamsVoting(),
        this.getGovParamsDeposit(),
        this.getGovParamsTally(),
      ]).then(([voting, deposit, tally]) => {
        const govParams = {
          ...voting.voting_params,
          ...deposit.deposit_params,
          ...tally.tally_params,
        };
        this.gov.items = paramItems(govParams);
      });
    },
    async handleAbciInfo() {
      const res = await this.fetchAbciInfo();

      localStorage.setItem(
        `sdk_version_${this.blockchain.chainName}`,
        String(res.application_version.cosmos_sdk_version)
      );

      this.appVersion.items = paramItems(res.application_version);
      this.nodeVersion.items = paramItems(res.default_node_info);
    },
    async getBaseTendermintBlockLatest() {
      return await this.blockchain.rpc.getBaseBlockLatest();
    },
    async getMintParam() {
      return await this.blockchain.rpc.getMintParam();
    },
    async getStakingParams() {
      return await this.blockchain.rpc.getStakingParams();
    },
    async getStakingPool() {
      return await this.blockchain.rpc.getStakingPool();
    },
    async getBankTotal(denom: string) {
      return await this.blockchain.rpc.getBankSupplyByDenom(denom);
      // if (compareVersions(this.config.sdk_version, '0.46.2') > 0) {
      //     return this.get(`/cosmos/bank/v1beta1/supply/by_denom?denom=${denom}`).then(data => commonProcess(data).amount)
      //   }
      //   if (compareVersions(this.config.sdk_version, '0.40') < 0) {
      //     return this.get(`/supply/total/${denom}`).then(data => ({ amount: commonProcess(data), denom }))
      //   }
      //   return this.get(`/cosmos/bank/v1beta1/supply/${denom}`).then(data => commonProcess(data).amount)
    },
    async getSlashingParams() {
      return await this.blockchain.rpc.getSlashingParams();
    },
    async getDistributionParams() {
      return await this.blockchain.rpc.getDistributionParams();
    },
    async getGovParamsVoting() {
      return await this.blockchain.rpc.getGovParamsVoting();
    },
    async getGovParamsDeposit() {
      return await this.blockchain.rpc.getGovParamsDeposit();
    },
    async getGovParamsTally() {
      return await this.blockchain.rpc.getGovParamsTally();
    },
    async fetchAbciInfo() {
      return this.blockchain.rpc.getBaseNodeInfo();
    },
  },
});
