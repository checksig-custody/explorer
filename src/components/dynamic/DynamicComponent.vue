<script lang="ts" setup>
import { select } from './index';

defineProps<{ value?: unknown; direct?: string }>();
</script>
<template>
  <Component :is="select(value, direct)" :value="value" />
</template>
