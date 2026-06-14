<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CarryInfo } from '@/types/game'
import { ITEM_WEIGHTS } from '@/types/game'

interface Props {
  wood: number
  stone: number
  carryInfo: CarryInfo
  disabled: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  discardWood: [amount: number]
  discardStone: [amount: number]
  autoDiscard: []
}>()

const woodDiscardAmount = ref(1)
const stoneDiscardAmount = ref(1)

watch(
  () => props.wood,
  (newVal) => {
    if (woodDiscardAmount.value > newVal) {
      woodDiscardAmount.value = Math.max(1, newVal)
    }
  }
)

watch(
  () => props.stone,
  (newVal) => {
    if (stoneDiscardAmount.value > newVal) {
      stoneDiscardAmount.value = Math.max(1, newVal)
    }
  }
)

const burdenColorClass = computed(() => {
  switch (props.carryInfo.burdenLevel) {
    case 'overload':
      return 'bg-red-500/10 border-red-500/40'
    case 'warning':
      return 'bg-yellow-500/10 border-yellow-500/40'
    default:
      return 'bg-green-500/5 border-green-500/20'
  }
})

const burdenTextClass = computed(() => {
  switch (props.carryInfo.burdenLevel) {
    case 'overload':
      return 'text-red-400'
    case 'warning':
      return 'text-yellow-400'
    default:
      return 'text-green-400'
  }
})

const burdenLabel = computed(() => {
  switch (props.carryInfo.burdenLevel) {
    case 'overload':
      return '🚨 严重超重'
    case 'warning':
      return '⚠️ 负重过高'
    default:
      return '✅ 正常'
  }
})

const needDiscard = computed(() => props.carryInfo.burdenLevel !== 'normal')

function incrementWood() {
  if (woodDiscardAmount.value < props.wood) {
    woodDiscardAmount.value++
  }
}

function decrementWood() {
  if (woodDiscardAmount.value > 1) {
    woodDiscardAmount.value--
  }
}

function setWoodMax() {
  woodDiscardAmount.value = Math.max(1, props.wood)
}

function incrementStone() {
  if (stoneDiscardAmount.value < props.stone) {
    stoneDiscardAmount.value++
  }
}

function decrementStone() {
  if (stoneDiscardAmount.value > 1) {
    stoneDiscardAmount.value--
  }
}

function setStoneMax() {
  stoneDiscardAmount.value = Math.max(1, props.stone)
}

function handleDiscardWood() {
  if (woodDiscardAmount.value > 0 && props.wood >= woodDiscardAmount.value) {
    emit('discardWood', woodDiscardAmount.value)
    woodDiscardAmount.value = 1
  }
}

function handleDiscardStone() {
  if (stoneDiscardAmount.value > 0 && props.stone >= stoneDiscardAmount.value) {
    emit('discardStone', stoneDiscardAmount.value)
    stoneDiscardAmount.value = 1
  }
}
</script>

<template>
  <div class="bg-game-card rounded-2xl p-6 border border-game-border shadow-xl">
    <h2 class="text-xl font-bold text-white mb-5 flex items-center gap-2">
      <span>🎒</span>
      <span>背包整理</span>
      <span :class="[burdenTextClass, 'text-xs font-normal ml-2']">
        {{ burdenLabel }}
      </span>
    </h2>

    <div
      :class="[burdenColorClass, 'rounded-xl p-4 border mb-5 transition-all duration-300']"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-gray-300 text-sm">当前负重</span>
        <span :class="[burdenTextClass, 'font-bold text-lg tabular-nums']">
          {{ carryInfo.currentWeight }} / {{ carryInfo.maxCapacity }}
        </span>
      </div>
      <div class="h-2.5 bg-gray-800 rounded-full overflow-hidden mb-3">
        <div
          :class="[
            carryInfo.burdenLevel === 'overload' ? 'bg-red-500' :
            carryInfo.burdenLevel === 'warning' ? 'bg-yellow-500' : 'bg-green-500',
            'h-full rounded-full transition-all duration-300 ease-out'
          ]"
          :style="{ width: `${Math.min(100, (carryInfo.currentWeight / carryInfo.maxCapacity) * 100)}%` }"
        ></div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
          <span class="text-amber-500">🪵 木材重量</span>
          <span class="text-gray-300 font-medium">{{ wood * ITEM_WEIGHTS.wood }}</span>
        </div>
        <div class="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
          <span class="text-gray-400">🪨 石头重量</span>
          <span class="text-gray-300 font-medium">{{ stone * ITEM_WEIGHTS.stone }}</span>
        </div>
      </div>
    </div>

    <div class="space-y-3 mb-5">
      <div class="bg-gray-800/30 rounded-xl p-4 border border-game-border">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🪵</span>
            <div>
              <span class="text-amber-500 font-medium">木材</span>
              <span class="text-gray-500 text-xs ml-2">× 2 重量/个</span>
            </div>
          </div>
          <span class="text-gray-300 font-bold">库存: {{ wood }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="decrementWood"
            :disabled="disabled || woodDiscardAmount <= 1"
            class="w-10 h-10 rounded-lg bg-gray-700/60 text-gray-300 font-bold text-lg
              hover:bg-gray-600/80 disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200 flex items-center justify-center"
          >−</button>
          <div class="flex-1 flex items-center justify-center">
            <input
              v-model.number="woodDiscardAmount"
              type="number"
              min="1"
              :max="wood"
              class="w-20 text-center bg-gray-800 border border-gray-600 rounded-lg
                py-2 text-white font-bold tabular-nums focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            @click="incrementWood"
            :disabled="disabled || woodDiscardAmount >= wood"
            class="w-10 h-10 rounded-lg bg-gray-700/60 text-gray-300 font-bold text-lg
              hover:bg-gray-600/80 disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200 flex items-center justify-center"
          >+</button>
          <button
            @click="setWoodMax"
            :disabled="disabled || wood <= 0"
            class="px-3 h-10 rounded-lg bg-gray-700/60 text-gray-300 text-xs font-medium
              hover:bg-gray-600/80 disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200"
          >全部</button>
        </div>
        <button
          @click="handleDiscardWood"
          :disabled="disabled || wood <= 0 || woodDiscardAmount <= 0"
          class="w-full mt-3 py-2.5 rounded-lg bg-amber-700/40 border border-amber-600/40
            text-amber-400 font-medium text-sm hover:bg-amber-600/50
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200 active:scale-[0.98]"
        >
          丢弃 {{ woodDiscardAmount }} 个木材（减少 {{ woodDiscardAmount * ITEM_WEIGHTS.wood }} 重量）
        </button>
      </div>

      <div class="bg-gray-800/30 rounded-xl p-4 border border-game-border">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🪨</span>
            <div>
              <span class="text-gray-400 font-medium">石头</span>
              <span class="text-gray-500 text-xs ml-2">× 3 重量/个</span>
            </div>
          </div>
          <span class="text-gray-300 font-bold">库存: {{ stone }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="decrementStone"
            :disabled="disabled || stoneDiscardAmount <= 1"
            class="w-10 h-10 rounded-lg bg-gray-700/60 text-gray-300 font-bold text-lg
              hover:bg-gray-600/80 disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200 flex items-center justify-center"
          >−</button>
          <div class="flex-1 flex items-center justify-center">
            <input
              v-model.number="stoneDiscardAmount"
              type="number"
              min="1"
              :max="stone"
              class="w-20 text-center bg-gray-800 border border-gray-600 rounded-lg
                py-2 text-white font-bold tabular-nums focus:outline-none focus:border-gray-400"
            />
          </div>
          <button
            @click="incrementStone"
            :disabled="disabled || stoneDiscardAmount >= stone"
            class="w-10 h-10 rounded-lg bg-gray-700/60 text-gray-300 font-bold text-lg
              hover:bg-gray-600/80 disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200 flex items-center justify-center"
          >+</button>
          <button
            @click="setStoneMax"
            :disabled="disabled || stone <= 0"
            class="px-3 h-10 rounded-lg bg-gray-700/60 text-gray-300 text-xs font-medium
              hover:bg-gray-600/80 disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200"
          >全部</button>
        </div>
        <button
          @click="handleDiscardStone"
          :disabled="disabled || stone <= 0 || stoneDiscardAmount <= 0"
          class="w-full mt-3 py-2.5 rounded-lg bg-gray-600/40 border border-gray-500/40
            text-gray-300 font-medium text-sm hover:bg-gray-500/50
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200 active:scale-[0.98]"
        >
          丢弃 {{ stoneDiscardAmount }} 个石头（减少 {{ stoneDiscardAmount * ITEM_WEIGHTS.stone }} 重量）
        </button>
      </div>
    </div>

    <button
      @click="$emit('autoDiscard')"
      :disabled="disabled || !needDiscard"
      :class="[
        'w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.98]',
        needDiscard
          ? 'bg-gradient-to-r from-orange-600/60 to-red-600/60 border border-orange-500/50 text-white hover:from-orange-500/70 hover:to-red-500/70 shadow-lg shadow-orange-500/10'
          : 'bg-gray-700/30 border border-gray-600/30 text-gray-500 cursor-not-allowed',
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      ]"
    >
      <span v-if="needDiscard">⚡ 一键整理背包（降至 70% 负重）</span>
      <span v-else>✅ 负重状态良好，无需整理</span>
    </button>

    <div class="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
      <p class="text-blue-400/80 text-xs leading-relaxed">
        💡 <span class="font-medium">提示：</span>
        负重超过 80% 采集效率下降 30%，超过 100% 下降 60%。合理管理背包空间能让你生存更久！
      </p>
    </div>
  </div>
</template>
