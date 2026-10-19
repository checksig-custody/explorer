<script lang="ts" setup>
import { fromBase64 } from '@cosmjs/encoding';
import { decodeTxRaw } from '@cosmjs/proto-signing';
import { computed } from 'vue';
import { hashTx } from '@/libs';
import { useBlockchain, useFormatter } from '@/stores';
const props = defineProps<{ value: string[] | undefined }>();

const txs = computed(() => {
  return (
    props.value?.map((x) => {
      const tx_bytes = fromBase64(x);
      let tx = null;
      let injected = 'Standard';
      try {
        tx = decodeTxRaw(fromBase64(x));
      } catch {
        injected = 'Injected';
      }
      return {
        hash: hashTx(tx_bytes),
        tx,
        injected,
      };
    }) ?? []
  );
});

const format = useFormatter();
const chain = useBlockchain();
</script>
<template>
  <div class="overflow-x-auto mt-4">
    <table v-if="txs.length > 0" class="table w-full" density="compact">
      <thead>
        <tr>
          <th>Type</th>
          <th style="position: relative; z-index: 2">Hash</th>
          <th>Msgs</th>
          <th>Memo</th>
        </tr>
      </thead>
      <tbody class="text-sm">
        <tr v-for="(item, index) in txs" :key="index">
          <td>{{ item.injected }}</td>
          <td>
            <span v-if="item.injected === 'Injected'">{{ item.hash }}</span>
            <RouterLink
              v-else
              :to="`/${chain.chainName}/tx/${item.hash}`"
              class="text-primary dark:invert"
              >{{ item.hash }}</RouterLink
            >
          </td>
          <td>
            <span v-if="item.tx">
              {{
                format.messages(
                  item.tx.body.messages.map((x) => ({ '@type': x.typeUrl }))
                )
              }}
            </span>
          </td>
          <td>
            <span v-if="item.tx">{{ item.tx.body.memo }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="text-center">No Transactions</div>
  </div>
</template>
