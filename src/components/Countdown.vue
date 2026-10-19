<script lang="ts" setup>
import Countdown from '@chenfengyuan/vue-countdown';

defineOptions({ name: 'CountdownTimer' });

defineProps({
  time: { type: Number, default: undefined },
  css: { type: String, default: undefined },
});
</script>
<template>
  <Countdown
    v-if="time"
    v-slot="{ days, hours, minutes, seconds }"
    :time="time > 0 ? time : 0"
    class="countdown-container justify-items-center"
  >
    <span class="text-primary font-bold" :class="css">{{ days }}</span> days
    <span class="text-primary font-bold" :class="css">{{ hours }}</span> hours
    <span class="text-primary font-bold" :class="css">{{ minutes }}</span>
    minutes
    <span class="text-primary font-bold w-40" :class="css">
      <Transition name="slide-up">
        <span v-if="seconds % 2 === 0" class="countdown">{{ seconds }}</span>
        <span v-else class="countdown">{{ seconds }}</span>
      </Transition>
    </span>
    <span class="ml-10">seconds</span>
  </Countdown>
</template>

<style>
.countdown-container {
  display: inline-flexbox;
  position: relative;
}

.countdown {
  position: absolute;
  width: 45%;
  text-align: right;
  float: right;
}
</style>
