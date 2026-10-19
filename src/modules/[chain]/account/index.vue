<script lang="ts" setup>
import { ref } from 'vue';
import { useBlockchain } from '@/stores';
import { PageRequest, type AuthAccount, type Pagination } from '@/types';
import { onMounted } from 'vue';
import PaginationBar from '@/components/PaginationBar.vue';
defineProps({ chain: { type: String, default: undefined } });

const chainStore = useBlockchain();

const accounts = ref([] as AuthAccount[]);
const pageRequest = ref(new PageRequest());
const pageResponse = ref<Partial<Pagination>>({});

onMounted(() => {
  pageload(1);
});

function pageload(p: number) {
  pageRequest.value.setPage(p);
  void chainStore.rpc.getAuthAccounts(pageRequest.value).then((x) => {
    accounts.value = x.accounts;
    pageResponse.value = x.pagination;
  });
}

function showType(v: string) {
  return v.replace('/cosmos.auth.v1beta1.', '');
}
function findField(v: unknown, field: string): unknown {
  if (!v || Array.isArray(v) || typeof v !== 'object') return null;
  const obj = v as Record<string, unknown>;
  const fields = Object.keys(obj);
  if (fields.includes(field)) {
    return obj[field];
  }
  for (const f of fields) {
    const re = findField(obj[f], field);
    if (re) return re;
  }
  return undefined;
}
function showAddress(v: unknown) {
  return findField(v, 'address');
}
function showAccountNumber(v: unknown) {
  return findField(v, 'account_number');
}
function showSequence(v: unknown) {
  return findField(v, 'sequence');
}
function showPubkey(v: unknown) {
  return findField(v, 'pub_key');
}
</script>
<template>
  <div class="overflow-x-auto">
    <table class="table table-compact">
      <thead>
        <tr>
          <td>{{ $t('account.type') }}</td>
          <td>{{ $t('account.address') }}</td>
          <td>{{ $t('account.acc_num') }}</td>
          <td>{{ $t('account.sequence') }}</td>
          <td>{{ $t('account.pub_key') }}</td>
        </tr>
      </thead>
      <tr v-for="(acc, i) in accounts" :key="i">
        <td>{{ showType(acc['@type']) }}</td>
        <td>
          <RouterLink :to="`/${chain}/account/${showAddress(acc)}`">{{ showAddress(acc) }}</RouterLink>
        </td>
        <td>{{ showAccountNumber(acc) }}</td>
        <td>{{ showSequence(acc) }}</td>
        <td>{{ showPubkey(acc) }}</td>
      </tr>
    </table>
    <PaginationBar :limit="pageRequest.limit" :total="pageResponse.total" :callback="pageload" />
  </div>
</template>
