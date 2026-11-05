<script setup lang="ts">
import { computed, ref } from 'vue';
import { suggestChain, type ChainInfo } from '@leapwallet/cosmos-snap-provider';
import { useDashboard, useBlockchain } from '@/stores';
import type { ChainConfig } from '@/types/chaindata';
import { NetworkType } from '@/types/chaindata';
import { CosmosRestClient } from '@/libs/client';
import { defined, orDefault } from '@/libs/utils';
import { onMounted } from 'vue';
import AdBanner from '@/components/ad/AdBanner.vue';

const error = ref('');
const conf = ref('');
const dashboard = useDashboard();
const selected = ref<ChainConfig | undefined>();
const wallet = ref('keplr');
const network = ref(NetworkType.Mainnet);
const mainnet = ref([] as ChainConfig[]);
const testnet = ref([] as ChainConfig[]);
const chains = computed(() => {
  return network.value === NetworkType.Mainnet ? mainnet.value : testnet.value;
});

onMounted(() => {
  const chainStore = useBlockchain();
  selected.value = chainStore.current ?? Object.values(dashboard.chains)[0];
  void initParamsForKeplr();

  void dashboard.loadLocalConfig(NetworkType.Mainnet).then((res) => {
    mainnet.value = Object.values<ChainConfig>(res);
  });
  void dashboard.loadLocalConfig(NetworkType.Testnet).then((res) => {
    testnet.value = Object.values<ChainConfig>(res);
  });
});

function onchange() {
  void (wallet.value === 'keplr' ? initParamsForKeplr() : initSnap());
}

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
  const asset = defined(chain.assets[0], 'denom_units');
  const coinDecimals = orDefault(
    asset.denom_units.find((x) => x.denom === asset.symbol.toLowerCase())
      ?.exponent,
    6
  );
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
          coinGeckoId: orDefault(asset.coingecko_id, 'unknown'),
        },
      ],
      feeCurrencies: [
        {
          coinDenom: asset.symbol,
          coinMinimalDenom: asset.base,
          coinDecimals,
          coinGeckoId: orDefault(asset.coingecko_id, 'unknown'),
          gasPriceStep,
        },
      ],
      gasPriceStep,
      stakeCurrency: {
        coinDenom: asset.symbol,
        coinMinimalDenom: asset.base,
        coinDecimals,
        coinGeckoId: orDefault(asset.coingecko_id, 'unknown'),
      },
      features: chain.keplrFeatures ?? [],
    },
    null,
    '\t'
  );
}

async function initSnap() {
  const chain = selected.value;
  const restEndpoint = chain?.endpoints.rest?.at(0);
  if (!chain || !restEndpoint) throw new Error('Endpoint does not set');
  const client = CosmosRestClient.newDefault(restEndpoint.address || '');
  const b = await client.getBaseBlockLatest();
  const chainId = b.block.header.chain_id;
  const token = defined(chain.assets[0], 'display');

  conf.value = JSON.stringify(
    {
      chainId,
      chainName: chain.chainName,
      bech32Config: {
        bech32PrefixAccAddr: chain.bech32Prefix,
      },
      bip44: {
        coinType: Number(chain.coinType),
      },
      feeCurrencies: [
        {
          coinDenom: token.display,
          coinMinimalDenom: token.base,
          coinDecimals: orDefault(
            token.denom_units.find((x) => x.denom === token.display)?.exponent,
            6
          ),
          coinGeckoId: token.coingecko_id,
          gasPriceStep: {
            low: 0.0625,
            average: 0.5,
            high: 62.5,
          },
        },
      ],
    },
    null,
    '\t'
  );
}

function suggest() {
  if (wallet.value === 'keplr') {
    if (window.keplr) {
      window.keplr
        .experimentalSuggestChain(JSON.parse(conf.value))
        .catch((e: unknown) => {
          error.value = String(e);
        });
    }
  } else {
    void suggestChain(JSON.parse(conf.value) as ChainInfo);
  }
}
</script>

<template>
  <div class="bg-base-100 p-4 rounded text-center">
    <div class="flex text-center">
      <select v-model="network" class="select select-bordered">
        <option :value="NetworkType.Mainnet">Mainnet</option>
        <option :value="NetworkType.Testnet">Testnet</option>
      </select>
      <select
        v-model="selected"
        class="select select-bordered mx-5"
        @change="onchange"
      >
        <option v-for="c in chains" :key="c.chainName" :value="c">
          {{ c.chainName }}
        </option>
      </select>
      <label
        ><input
          v-model="wallet"
          type="radio"
          value="keplr"
          class="radio radio-bordered"
          @change="onchange"
        />
        Keplr</label
      >
      <label
        ><input
          v-model="wallet"
          type="radio"
          value="metamask"
          class="radio radio-bordered ml-4"
          @change="onchange"
        />
        Metamask</label
      >
    </div>
    <div class="text-main mt-5">
      <textarea
        v-model="conf"
        class="textarea textarea-bordered w-full"
        rows="15"
      />
    </div>
    <div class="mt-4 mb-4">
      <button
        class="btn !bg-primary !border-primary text-white mr-2"
        @click="suggest"
      >
        Suggest {{ selected?.chainName }} TO {{ wallet }}
      </button>

      <div class="mt-4">
        If the chain is not offically support on Keplr/Metamask Snap, you can
        submit these parameters to enable Keplr/Metamask Snap.
      </div>
    </div>

    <AdBanner
      id="suggest-banner-ad"
      unit="banner"
      width="970px"
      height="90px"
    />
  </div>
</template>
