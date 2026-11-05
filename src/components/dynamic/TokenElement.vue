<script lang="ts" setup>
defineProps<{ value: Record<string, unknown> }>();
</script>
<template>
  <div class="overflow-auto">{{ value['amount'] }} {{ value['denom'] }}</div>
</template>
