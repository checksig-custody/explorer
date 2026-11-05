<script lang="ts" setup>
const props = defineProps<{ value: unknown }>();
</script>
<template>
  <span>{{ props.value }}</span>
</template>
