<script setup lang="ts">
import { computed } from 'vue'
import type { CarryInfo } from '@/types/game'

interface StatItem {
  label: string
  value: number
  max: number
  icon: string
  color: string
  barColor: string
  isReverse?: boolean
}

interface Props {
  health: number
  hunger: number
  thirst: number
  wood: number
  stone: number
  carryInfo: CarryInfo
}

const props = defineProps<Props>()

const stats = computed<StatItem[]>(() => [
  {
    label: '生命值',
    value: props.health,
    max: 100,
    icon: '❤️',
    color: 'text-red-400',
    barColor: 'bg-red-500',
  },
  {
    label: '饥饿值',
    value: props.hunger,
    max: 100,
    icon: '🍖',
    color: 'text-orange-400',
    barColor: 'bg-orange-500',
    isReverse: true,
  },
  {
    label: '口渴值',
    value: props.thirst,
    max: 100,
    icon: '💧',
    color: 'text-blue-400',
    barColor: 'bg-blue-500',
    isReverse: true,
  },
  {
    label: '木材',
    value: props.wood,
    max: 100,
    icon: '🪵',
    color: 'text-amber-600',
    barColor: 'bg-amber-600',
  },
  {
    label: '石头',
    value: props.stone,
    max: 100,
    icon: '🪨',
    color: 'text-gray-400',
    barColor: 'bg-gray-400',
  },
])

const burdenStatus = computed(() => {
  const { burdenLevel, penaltyMultiplier, currentWeight, maxCapacity } = props.carryInfo
  const penaltyPercent = Math.round((1 - penaltyMultiplier) * 100)

  let label = '正常'
  let color = 'text-green-400'
  let icon = '✅'
  let bgClass = 'bg-green-500/10 border-green-500/30'
  let barColor = 'bg-green-500'
  let tip = ''

  if (burdenLevel === 'overload') {
    label = '严重超重'
    color = 'text-red-400'
    icon = '🚨'
    bgClass = 'bg-red-500/10 border-red-500/30'
    barColor = 'bg-red-500'
    tip = `采集收益下降 ${penaltyPercent}%，请尽快整理背包！`
  } else if (burdenLevel === 'warning') {
    label = '负重过高'
    color = 'text-yellow-400'
    icon = '⚠️'
    bgClass = 'bg-yellow-500/10 border-yellow-500/30'
    barColor = 'bg-yellow-500'
    tip = `采集收益下降 ${penaltyPercent}%`
  }

  return { label, color, icon, bgClass, barColor, tip, currentWeight, maxCapacity }
})

function getBarWidth(value: number, max: number): string {
  const percent = Math.max(0, Math.min(100, (value / max) * 100))
  return `${percent}%`
}

function isDanger(value: number, max: number, isReverse?: boolean): boolean {
  const percent = (value / max) * 100
  if (isReverse) {
    return percent >= 80
  }
  return percent <= 20
}
</script>

<template>
  <div class="bg-game-card rounded-2xl p-6 border border-game-border shadow-xl">
    <h2 class="text-xl font-bold text-white mb-5 flex items-center gap-2">
      <span>📊</span>
      <span>生存状态</span>
    </h2>
    <div class="space-y-4">
      <div
        :class="[burdenStatus.bgClass, 'rounded-xl p-4 border transition-all duration-300',
          burdenStatus.color === 'text-red-400' ? 'animate-pulse-soft' : ''
        ]"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-lg">🎒</span>
            <span :class="[burdenStatus.color, 'font-bold text-sm']">背包负重</span>
            <span :class="[burdenStatus.color, 'text-xs flex items-center gap-1']">
              {{ burdenStatus.icon }} {{ burdenStatus.label }}
            </span>
          </div>
          <span :class="[burdenStatus.color, 'font-bold text-sm tabular-nums']">
            {{ burdenStatus.currentWeight }} / {{ burdenStatus.maxCapacity }}
          </span>
        </div>
        <div class="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            :class="[burdenStatus.barColor, 'h-full rounded-full transition-all duration-300 ease-out']"
            :style="{ width: getBarWidth(burdenStatus.currentWeight, burdenStatus.maxCapacity) }"
          ></div>
        </div>
        <div
          v-if="burdenStatus.tip"
          :class="[burdenStatus.color, 'text-xs mt-2 flex items-center gap-1']"
        >
          <span>💡</span>
          <span>{{ burdenStatus.tip }}</span>
        </div>
        <div class="text-xs text-gray-500 mt-2 flex gap-4">
          <span>🪵 木材: {{ wood }} × 2 = {{ wood * 2 }}</span>
          <span>🪨 石头: {{ stone }} × 3 = {{ stone * 3 }}</span>
        </div>
      </div>

      <div
        v-for="stat in stats"
        :key="stat.label"
        class="group"
      >
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2">
            <span class="text-lg">{{ stat.icon }}</span>
            <span :class="[stat.color, 'font-medium text-sm']">{{ stat.label }}</span>
          </div>
          <span
            :class="[
              stat.color,
              'font-bold text-sm tabular-nums',
              isDanger(stat.value, stat.max, stat.isReverse) ? 'animate-pulse-soft' : '',
            ]"
          >
            {{ Math.round(stat.value) }}
          </span>
        </div>
        <div class="h-2.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            :class="[stat.barColor, 'h-full rounded-full transition-all duration-300 ease-out']"
            :style="{ width: getBarWidth(stat.value, stat.max) }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>
