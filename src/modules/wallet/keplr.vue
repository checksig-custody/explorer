<script setup lang="ts">
import { ref } from 'vue';
import { useDashboard, useBlockchain } from '@/stores';
import type { ChainConfig } from '@/types/chaindata';
import { CosmosRestClient } from '@/libs/client';
import { onMounted } from 'vue';
import AdBanner from '@/components/ad/AdBanner.vue';

const error = ref('');
const conf = ref('');
const dashboard = useDashboard();
const selected = ref<ChainConfig | undefined>();

onMounted(() => {
  const chainStore = useBlockchain();
  selected.value = chainStore.current ?? Object.values(dashboard.chains)[0];
  void initParamsForKeplr();
});
async function initParamsForKeplr() {
  const chain = selected.value;
  const restEndpoint = chain?.endpoints.rest?.at(0);
  if (!chain || !restEndpoint) throw new Error('Endpoint does not set');
  const client = CosmosRestClient.newDefault(restEndpoint.address || '');
  const b = await client.getBaseBlockLatest();
  const chainid = b.block.header.chain_id;

  const gasPriceStep = chain.keplrPriceStep ?? {
    low: 0.01,
    average: 0.025,
    high: 0.03,
  };
  const asset = chain.assets[0];
  if (!asset) throw new Error('The chain has no assets');
  const coinDecimals =
    asset.denom_units.find((x) => x.denom === asset.symbol.toLowerCase())
      ?.exponent || 6;
  conf.value = JSON.stringify(
    {
      chainId: chainid,
      chainName: chain.chainName,
      rpc: chain.endpoints.rpc?.at(0)?.address,
      rest: restEndpoint.address,
      bip44: {
        coinType: Number(chain.coinType),
      },
      coinType: Number(chain.coinType),
      bech32Config: {
        bech32PrefixAccAddr: chain.bech32Prefix,
        bech32PrefixAccPub: `${chain.bech32Prefix}pub`,
        bech32PrefixValAddr: `${chain.bech32Prefix}valoper`,
        bech32PrefixValPub: `${chain.bech32Prefix}valoperpub`,
        bech32PrefixConsAddr: `${chain.bech32Prefix}valcons`,
        bech32PrefixConsPub: `${chain.bech32Prefix}valconspub`,
      },
      currencies: [
        {
          coinDenom: asset.symbol,
          coinMinimalDenom: asset.base,
          coinDecimals,
          coinGeckoId: asset.coingecko_id || 'unknown',
        },
      ],
      feeCurrencies: [
        {
          coinDenom: asset.symbol,
          coinMinimalDenom: asset.base,
          coinDecimals,
          coinGeckoId: asset.coingecko_id || 'unknown',
          gasPriceStep,
        },
      ],
      gasPriceStep,
      stakeCurrency: {
        coinDenom: asset.symbol,
        coinMinimalDenom: asset.base,
        coinDecimals,
        coinGeckoId: asset.coingecko_id || 'unknown',
      },
      features: chain.keplrFeatures ?? [],
    },
    null,
    '\t'
  );
}

function suggest() {
  if (window.keplr) {
    window.keplr
      .experimentalSuggestChain(JSON.parse(conf.value))
      .catch((e: unknown) => {
        error.value = String(e);
      });
  }
}
</script>

<template>
  <div class="bg-base-100 p-4 rounded text-center">
    <AdBanner id="keplr-banner-ad" unit="banner" width="970px" height="90px" />
    <div class="flex">
      <select
        v-model="selected"
        class="select select-bordered mx-5"
        @change="initParamsForKeplr"
      >
        <option v-for="c in dashboard.chains" :key="c.chainName" :value="c">
          {{ c.chainName }}
        </option>
      </select>
      <button class="btn !bg-yes !border-yes text-white px-10" @click="suggest">
        Add {{ selected?.chainName }} TO Keplr Wallet
      </button>
    </div>
    <div class="text-main mt-5">
      <textarea
        v-model="conf"
        class="textarea textarea-bordered w-full"
        rows="15"
      />
    </div>
    <div class="mt-4 mb-4">
      If the chain is not offically support on Keplr, you can submit these
      parameters to enable Keplr.
    </div>
  </div>
</template>
