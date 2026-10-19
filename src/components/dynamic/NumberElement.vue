<script lang="ts" setup>
const props = defineProps<{ value: unknown }>();
</script>
<template>
  <span>{{ Number(props.value) }}</span>
</template>
