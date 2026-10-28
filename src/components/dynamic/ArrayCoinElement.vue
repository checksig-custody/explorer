<script lang="ts" setup>
import { useFormatter } from '@/stores';
import type { Coin } from '@/types';

defineProps<{ value: Coin[] | undefined }>();

const format = useFormatter();
</script>
<template>
  <div>
    {{ format.formatTokens(value, true, '0,0.[000000]') }}
  </div>
</template>
<script lang="ts">
export default {
  name: 'ArrayCoinElement',
};
</script>
