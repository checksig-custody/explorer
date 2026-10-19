<script lang="ts" setup>
import { computed, ref, type PropType } from 'vue';

const props = defineProps({
  total: { type: String as PropType<string | undefined>, default: undefined },
  limit: { type: Number as PropType<number | undefined>, default: undefined },
  callback: {
    type: Function as PropType<(page: number) => void>,
    required: true,
  },
});
const current = ref(1);
const showSize = 3;
const pages = computed(() => {
  const pages: { color: string; page: number }[] = [];
  const total = Number(props.total || 0);
  if (total > 0 && props.limit && total > props.limit) {
    let page = 0;
    for (;;) {
      if (page * props.limit >= total) break;
      page += 1;
      if (
        total / props.limit > 10 &&
        page > showSize &&
        page < total / props.limit - showSize + 1
      ) {
        if (!(page >= current.value - 1 && page <= current.value + 1)) {
          continue;
        }
      }
      pages.push({
        color: page === current.value ? 'btn-primary' : '',
        page: page,
      });
    }
  }
  return pages;
});

function gotoPage(pageNum: number) {
  current.value = pageNum;
  props.callback(pageNum);
}
</script>
<template>
  <div class="my-5 text-center">
    <div v-if="total && limit" class="btn-group">
      <button
        v-for="{ page, color } in pages"
        :key="page"
        class="btn bg-gray-100 text-gray-500 hover:text-white border-none dark:bg-gray-800 dark:text-white"
        :class="{
          '!btn-primary': color === 'btn-primary',
        }"
        @click="gotoPage(page)"
      >
        {{ page }}
      </button>
    </div>
  </div>
</template>
