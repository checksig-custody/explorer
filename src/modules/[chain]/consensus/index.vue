<script lang="ts" setup>
import fetch from 'cross-fetch';
import { onMounted, ref, computed, onUnmounted } from 'vue';
import { useBlockchain, useFormatter, useStakingStore, useBaseStore } from '@/stores';
import { consensusPubkeyToHexAddress } from '@/libs';
import type { Validator } from '@/types';

interface HeightVoteSet {
  round: number;
  prevotes_bit_array: string;
  prevotes: string[];
  precommits: string[];
}

// The consensus state as the node reports it.
interface RoundState {
  'height/round/step'?: string;
  proposer?: { index?: number };
  height_vote_set?: HeightVoteSet[];
}

const format = useFormatter();
const chainStore = useBlockchain();
const stakingStore = useStakingStore();
const baseStore = useBaseStore();
const rpcList = ref(chainStore.current?.endpoints.rpc ?? [{ address: '', provider: '' }]);
const rpc = ref('');

const httpstatus = ref(200);
const httpStatusText = ref('');
const roundState = ref<RoundState>({});
const rate = ref('');
const height = ref('');
const round = ref('');
const step = ref('');
let timer: ReturnType<typeof setInterval> | undefined;
const updatetime = ref(new Date());
const positions = ref<{ address?: string }[]>([]);
const validatorsData = ref<Validator[]>([]);
onMounted(async () => {
  // stakingStore.init();
  validatorsData.value = (await stakingStore.fetchAcitveValdiators()) ?? [];
  const first = rpcList.value[0];
  if (!first) return;
  rpc.value = first.address + '/consensus_state';
  await fetchPosition();
  update();
  clearTime();
  timer = setInterval(() => {
    update();
  }, Math.round(baseStore.blocktime / 2));
});
onUnmounted(() => {
  clearTime();
});

function clearTime() {
  clearInterval(timer);
  timer = undefined;
}
const newTime = computed(() => {
  return format.toDay(updatetime.value, 'time');
});

const vals = computed(() => {
  return validatorsData.value.map((x) => ({ ...x, hex: consensusPubkeyToHexAddress(x.consensus_pubkey) }));
});

function showName(i: number, text: string) {
  if (text === 'nil-Vote') {
    const address = positions.value[i]?.address;
    if (address) {
      const val = vals.value.find((x) => x.hex === address);
      return val?.description.moniker || i;
    }
    return i;
  }
  return undefined;
}
async function onChange() {
  httpstatus.value = 200;
  httpStatusText.value = '';
  roundState.value = {};
  clearTime();
  await fetchPosition();
  update();
  timer = setInterval(() => {
    update();
  }, Math.round(baseStore.blocktime / 2));
}

async function fetchPosition() {
  const dumpurl = rpc.value.replace('consensus_state', 'dump_consensus_state');
  try {
    const response = await fetch(dumpurl);
    if (!response.ok) {
      throw new Error(`HTTP error: ${String(response.status)}`);
    }

    httpstatus.value = response.status;
    httpStatusText.value = response.statusText;

    const data = (await response.json()) as {
      result: { round_state: { validators: { validators: { address?: string }[] } } };
    };
    positions.value = data.result.round_state.validators.validators;
  } catch (error) {
    const err = error as { status?: number; message?: string };
    httpstatus.value = err.status || 500;
    httpStatusText.value = err.message || 'Error';
  }
}

function update() {
  rate.value = '0%';
  updatetime.value = new Date();
  if (httpstatus.value === 200) {
    fetch(rpc.value)
      .then((data) => {
        httpstatus.value = data.status;
        httpStatusText.value = data.statusText;
        return data.json() as Promise<{ result: { round_state: RoundState } }>;
      })
      .then((res) => {
        roundState.value = res.result.round_state;
        const raw = roundState.value['height/round/step']?.split('/');
        if (!raw) throw new Error('The consensus state has no height/round/step');
        height.value = raw[0] ?? '';
        round.value = raw[1] ?? '';
        step.value = raw[2] ?? '';

        // find the highest onboard rate
        roundState.value.height_vote_set?.forEach((element) => {
          const rates = Number(element.prevotes_bit_array.substring(element.prevotes_bit_array.length - 4));
          if (rates > 0) {
            rate.value = `${(rates * 100).toFixed()}%`;
          }
        });
      })
      .catch((err: unknown) => {
        httpstatus.value = 500;
        httpStatusText.value = String(err);
      });
  }
}
</script>
<template>
  <div>
    <!--  -->
    <div class="bg-base-100 px-4 pt-3 pb-4 rounded shadow">
      <div class="form-control">
        <label class="input-group input-group-md w-full flex">
          <!-- <input
            type="text"
            placeholder="Button on both side"
            class="input input-bordered input-md w-full"
            v-model="rpc"
          /> -->
          <select v-model="rpc" class="select select-bordered w-full flex-1">
            <option v-for="(item, index) in rpcList" :key="index">{{ item?.address }}/consensus_state</option>
          </select>
          <button class="btn btn-primary" @click="onChange">
            {{ $t('consensus.monitor') }}
          </button>
        </label>
      </div>
      <div v-if="httpstatus !== 200" class="text-error mt-1">{{ httpstatus }}: {{ httpStatusText }}</div>
    </div>
    <!-- cards -->
    <div v-if="roundState['height/round/step']" class="mt-4">
      <div class="grid grid-cols-1 md:!grid-cols-4 auto-cols-auto gap-4 pb-4">
        <div class="bg-base-100 px-4 py-3 rounded shadow flex justify-between items-center">
          <div class="text-sm mb-1 flex flex-col truncate">
            <h4 class="text-lg font-semibold text-main">{{ rate }}</h4>
            <span class="text-md">{{ $t('consensus.onboard_rate') }}</span>
          </div>
          <div class="avatar placeholder">
            <div class="bg-rose-100 text-neutral-content rounded-full w-12 h-12">
              <span class="text-2xl text-error font-semibold">{{ $t('consensus.o') }}</span>
            </div>
          </div>
        </div>
        <!-- Height -->
        <div class="bg-base-100 px-4 py-3 rounded shadow flex justify-between items-center">
          <div class="text-sm mb-1 flex flex-col truncate">
            <h4 class="text-lg font-semibold text-main">{{ height }}</h4>
            <span class="text-md">{{ $t('account.height') }}</span>
          </div>
          <div class="avatar placeholder">
            <div class="bg-green-100 text-neutral-content rounded-full w-12 h-12">
              <span class="text-2xl text-success font-semibold">{{ $t('consensus.h') }}</span>
            </div>
          </div>
        </div>
        <!-- Round -->
        <div class="bg-base-100 px-4 py-3 rounded shadow flex justify-between items-center">
          <div class="text-sm mb-1 flex flex-col truncate">
            <h4 class="text-lg font-semibold text-main">{{ round }}</h4>
            <span class="text-md">{{ $t('consensus.round') }}</span>
          </div>
          <div class="avatar placeholder">
            <div class="bg-violet-100 text-neutral-content rounded-full w-12 h-12">
              <span class="text-2xl text-primary font-semibold">{{ $t('consensus.r') }}</span>
            </div>
          </div>
        </div>
        <!-- Step -->
        <div class="bg-base-100 px-4 py-3 rounded shadow flex justify-between items-center">
          <div class="text-sm mb-1 flex flex-col truncate">
            <h4 class="text-lg font-semibold text-main">{{ step }}</h4>
            <span class="text-md">{{ $t('consensus.step') }}</span>
          </div>
          <div class="avatar placeholder">
            <div class="bg-blue-100 text-neutral-content rounded-full w-12 h-12">
              <span class="text-2xl text-info font-semibold">{{ $t('consensus.s') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- update -->
    <div v-if="roundState['height/round/step']" class="bg-base-100 p-4 rounded shadow">
      <div class="flex flex-1 flex-col truncate">
        <h2 class="text-sm card-title text-error mb-6">{{ $t('consensus.updated_at') }} {{ newTime || '' }}</h2>
        <div v-for="item in roundState.height_vote_set" :key="item.round">
          <div class="text-xs mb-1">
            {{ $t('consensus.round') }}: {{ item.round }}
          </div>
          <div class="text-xs break-words">{{ item.prevotes_bit_array }}</div>

          <div class="flex flex-rows flex-wrap py-6">
            <div
              v-for="(pre, i) in item.prevotes"
              :key="i"
              class="w-48 rounded-3xl h-5 text-sm px-2 leading-5"
              size="sm"
              style="margin: 2px"
            >
              <span class="flex flex-rows justify-between">
                <span class="truncate">{{ showName(i, 'nil-Vote') }} </span>
                <span>
                  <span
                    class="tooltip"
                    :data-tip="pre"
                    :class="{
                      'bg-green-400': String(pre).toLowerCase() !== 'nil-vote',
                      'bg-red-400': String(pre).toLowerCase() === 'nil-vote',
                    }"
                    >&nbsp;</span
                  >
                  <span
                    class="tooltip ml-1"
                    :data-tip="item.precommits[i]"
                    :class="{
                      'bg-green-400': String(item.precommits[i]).toLowerCase() !== 'nil-vote',
                      'bg-red-400': String(item.precommits[i]).toLowerCase() === 'nil-vote',
                    }"
                    >&nbsp;</span
                  >
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="divider" />
    </div>

    <!-- alert-info -->
    <div class="text-[#00cfe8] bg-[rgba(0,207,232,0.12)] rounded shadow mt-4 alert-info">
      <div class="drop-shadow-md px-4 pt-2 pb-2" style="box-shadow: rgba(0, 207, 232, 0.4) 0px 6px 15px -7px">
        <h2 class="text-base font-semibold">{{ $t('consensus.tips') }}</h2>
      </div>
      <div class="px-4 py-4">
        <ul style="list-style-type: disc" class="pl-8">
          <li>
            {{ $t('consensus.tips_description_1') }}
          </li>
          <li>
            {{ $t('consensus.tips_description_2') }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<route>
  {
    meta: {
      i18n: 'consensus',
    }
  }
</route>
