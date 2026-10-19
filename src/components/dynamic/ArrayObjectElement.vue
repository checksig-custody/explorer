<script lang="ts" setup>
import { computed } from 'vue';
import DynamicComponent from './DynamicComponent.vue';

const props = withDefaults(defineProps<{ value: Record<string, unknown>[] | undefined; thead?: boolean }>(), {
  thead: true,
});

const header = computed(() => {
  const [first] = props.value ?? [];
  if (first) {
    return Object.keys(first);
  }
  return [];
});
</script>
<template>
  <div class="overflow-auto max-h-96">
    <table class="table table-xs table-compact table-pin-rows w-full">
      <thead v-if="thead">
        <tr>
          <th v-for="(item, index) in header" :key="index" class="text-left capitalize">
            {{ item.replace(/_/g, ' ') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in value" :key="index">
          <td v-for="(el, key) in header" :key="key">
            <DynamicComponent :value="item[el]" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
