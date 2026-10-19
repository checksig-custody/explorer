<script lang="ts" setup>
import { useDashboard } from '@/stores';
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import type { ChainConfig } from '@/types/chaindata';

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
});

const dashboardStore = useDashboard();
// An empty object until the chain is loaded.
const conf = computed<Partial<ChainConfig>>(
  () => dashboardStore.chains[props.name] ?? {}
);

const addFavor = (e: Event) => {
  e.stopPropagation();
  e.preventDefault();
  dashboardStore.favoriteMap[props.name] =
    !dashboardStore.favoriteMap[props.name];
  window.localStorage.setItem(
    'favoriteMap',
    JSON.stringify(dashboardStore.favoriteMap)
  );
};
</script>
<template>
  <RouterLink
    :to="`/${name}`"
    class="bg-base-100 hover:bg-gray-100 dark:hover:bg-[#373f59] rounded shadow flex items-center px-3 py-3 cursor-pointer"
  >
    <div class="w-8 h-8 rounded-full overflow-hidden">
      <img :src="conf.logo" />
    </div>
    <div class="font-semibold ml-4 text-base flex-1 truncate capitalize">
      {{ conf?.prettyName || props.name }}
    </div>
    <div
      class="pl-4 text-xl"
      :class="{
        'text-warning': dashboardStore?.favoriteMap?.[props.name],
        'text-gray-300 dark:text-gray-500':
          !dashboardStore?.favoriteMap?.[props.name],
      }"
      @click="addFavor"
    >
      <Icon icon="mdi-star" />
    </div>
  </RouterLink>
</template>
