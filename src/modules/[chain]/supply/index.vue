<script lang="ts" setup>
import { ref } from 'vue';
import { useBlockchain, useFormatter } from '@/stores';
import { supplyRow, type SupplyAssetInfo, type SupplyRow } from '@/libs/supply';
import {
  PageRequest,
  type Pagination,
  type Coin,
  type DenomMetadata,
} from '@/types';
import { onMounted } from 'vue';
import PaginationBar from '@/components/PaginationBar.vue';
defineProps({ chain: { type: String, default: undefined } });

const format = useFormatter();
const chainStore = useBlockchain();

const list = ref<SupplyRow[]>([]);

const pageRequest = ref(new PageRequest());
const pageResponse = ref({} as Pagination);

onMounted(() => {
  pageload(1);
});

function findGlobalAssetConfig(denom: string) {
  const assets = chainStore.current?.assets;
  if (assets) {
    const conf = assets.find((a) => a.base === denom);
    if (conf) {
      return conf;
    }
  }
  return undefined;
}

function mergeDenomMetadata(
  denom: string,
  denomsMetadatas: DenomMetadata[]
): SupplyAssetInfo | undefined {
  const denomMetadata = denomsMetadatas.find((d) => d.base.endsWith(denom));
  const asset = findGlobalAssetConfig(denom);
  if (asset && denomMetadata) {
    return { ...denomMetadata, ...asset, display: denomMetadata.display };
  }
  return denomMetadata ?? asset;
}

function pageload(p: number) {
  pageRequest.value.setPage(p);
  void chainStore.rpc
    .getBankDenomMetadata()
    .then(async (denomsMetaResponse) => {
      const bankSupplyResponse = await chainStore.rpc.getBankSupply(
        pageRequest.value
      );
      list.value = bankSupplyResponse.supply.map((coin: Coin) => {
        const asset = mergeDenomMetadata(
          coin.denom,
          denomsMetaResponse.metadatas
        );
        return supplyRow(coin, asset, (denom) =>
          format.tokenAmountNumber({ amount: coin.amount, denom }).toString()
        );
      });
      pageResponse.value = bankSupplyResponse.pagination;
    });
}
</script>
<template>
  <div class="overflow-auto bg-base-100">
    <table class="table table-compact">
      <thead class="bg-base-200">
        <tr>
          <td>Logo</td>
          <td>Token</td>
          <td>Amount</td>
          <td>Info</td>
          <td>Base</td>
        </tr>
      </thead>
      <tr v-for="item in list" :key="item.base" class="hover">
        <td>
          <img v-if="item.logo" :src="item.logo" class="w-7 h-7" />
        </td>
        <td>{{ item.denom }}</td>
        <td>{{ item.amount }}</td>
        <td>{{ item.info }}</td>
        <td>{{ item.base }}</td>
      </tr>
    </table>
    <PaginationBar
      :limit="pageRequest.limit"
      :total="pageResponse.total"
      :callback="pageload"
    />
  </div>
</template>

<route>
    {
      meta: {
        i18n: 'supply',
        order: 17
      }
    }
  </route>
