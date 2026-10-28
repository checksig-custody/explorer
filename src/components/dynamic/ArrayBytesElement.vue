<script lang="ts" setup>
import { toBase64 } from '@cosmjs/encoding';

const props = defineProps<{ value: Uint8Array[] | undefined }>();
</script>
<template>
  <div>
    <div v-for="(item, index) of props.value" :key="index">
      {{ toBase64(item) }}
    </div>
  </div>
</template>
