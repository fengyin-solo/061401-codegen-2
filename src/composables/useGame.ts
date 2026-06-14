import { ref, computed } from 'vue'
import type { GameState, LogEntry, RandomEvent, ActionType, ActionEffect, CarryInfo } from '@/types/game'
import { ITEM_WEIGHTS } from '@/types/game'
import { randomEvents } from '@/data/events'

const STORAGE_KEY_HIGH_SCORE = 'survival_game_high_score'
const MAX_STAT = 100
const DEFAULT_MAX_CARRY = 100

const actionEffects: Record<ActionType, ActionEffect> = {
  gatherWood: {
    health: -5, hunger: 5, thirst: 3, wood: 10, stone: 0 },
  gatherStone: {
    health: -8, hunger: 6, thirst: 4, wood: 0, stone: 8 },
  hunt: {
    health: 15, hunger: -20, thirst: 5, wood: -5, stone: 0 },
  drink: {
    health: 0, hunger: 2, thirst: -25, wood: -3, stone: 0 },
}

const actionNames: Record<ActionType, string> = {
  gatherWood: '采集木头',
  gatherStone: '采集石头',
  hunt: '打猎',
  drink: '喝水',
}

export function useGame() {
  const state = ref<GameState>({
    health: 80,
    hunger: 30,
    thirst: 30,
    wood: 10,
    stone: 5,
    maxCarryCapacity: DEFAULT_MAX_CARRY,
    turn: 0,
    isGameOver: false,
    logs: [],
  })

  const highScore = ref<number>(0)
  let logIdCounter = 0

  const canAct = computed(() => !state.value.isGameOver)

  const carryInfo = computed<CarryInfo>(() => {
    const currentWeight =
      state.value.wood * ITEM_WEIGHTS.wood + state.value.stone * ITEM_WEIGHTS.stone
    const maxCapacity = state.value.maxCarryCapacity
    const burdenRatio = currentWeight / maxCapacity

    let burdenLevel: CarryInfo['burdenLevel'] = 'normal'
    let penaltyMultiplier = 1

    if (burdenRatio >= 1.0) {
      burdenLevel = 'overload'
      penaltyMultiplier = 0.4
    } else if (burdenRatio >= 0.8) {
      burdenLevel = 'warning'
      penaltyMultiplier = 0.7
    }

    return {
      currentWeight,
      maxCapacity,
      burdenLevel,
      burdenRatio,
      penaltyMultiplier,
    }
  })

  function loadHighScore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIGH_SCORE)
      if (saved) {
        highScore.value = parseInt(saved, 10) || 0
      }
    } catch (e) {
      highScore.value = 0
    }
  }

  function saveHighScore() {
    if (state.value.turn > highScore.value) {
      highScore.value = state.value.turn
      try {
        localStorage.setItem(STORAGE_KEY_HIGH_SCORE, String(highScore.value))
      } catch (e) {
        // ignore
      }
    }
  }

  function addLog(text: string, type: LogEntry['type'] = 'action') {
    state.value.logs.unshift({
      id: ++logIdCounter,
      text,
      type,
      turn: state.value.turn,
    })
    if (state.value.logs.length > 50) {
      state.value.logs.pop()
    }
  }

  function clampStat(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  function applyEffects(effects: ActionEffect, resourcePenalty: number = 1) {
    if (effects.health !== undefined) {
      state.value.health = clampStat(state.value.health + effects.health, 0, MAX_STAT)
    }
    if (effects.hunger !== undefined) {
      state.value.hunger = clampStat(state.value.hunger + effects.hunger, 0, MAX_STAT)
    }
    if (effects.thirst !== undefined) {
      state.value.thirst = clampStat(state.value.thirst + effects.thirst, 0, MAX_STAT)
    }
    if (effects.wood !== undefined) {
      let woodChange = effects.wood
      if (woodChange > 0 && resourcePenalty < 1) {
        woodChange = Math.floor(woodChange * resourcePenalty)
      }
      state.value.wood = Math.max(0, state.value.wood + woodChange)
    }
    if (effects.stone !== undefined) {
      let stoneChange = effects.stone
      if (stoneChange > 0 && resourcePenalty < 1) {
        stoneChange = Math.floor(stoneChange * resourcePenalty)
      }
      state.value.stone = Math.max(0, state.value.stone + stoneChange)
    }
  }

  function getRandomEvent(): RandomEvent {
    const index = Math.floor(Math.random() * randomEvents.length)
    return randomEvents[index]
  }

  function checkGameOver() {
    if (state.value.health <= 0 || state.value.hunger >= MAX_STAT || state.value.thirst >= MAX_STAT) {
      state.value.isGameOver = true
      saveHighScore()
      addLog('你没能在荒野中生存下来...', 'system')
    }
  }

  function canPerformAction(action: ActionType): boolean {
    if (state.value.isGameOver) return false
    const effects = actionEffects[action]
    if (effects.wood !== undefined && state.value.wood + effects.wood < 0) {
      return false
    }
    if (effects.stone !== undefined && state.value.stone + effects.stone < 0) {
      return false
    }
    return true
  }

  function performAction(action: ActionType) {
    if (!canPerformAction(action)) return

    const info = carryInfo.value
    const isGatherAction = action === 'gatherWood' || action === 'gatherStone'

    if (isGatherAction && info.burdenLevel !== 'normal') {
      const penaltyPercent = Math.round((1 - info.penaltyMultiplier) * 100)
      if (info.burdenLevel === 'overload') {
        addLog(`背包严重超重！采集收益下降 ${penaltyPercent}%，请尽快整理背包丢弃部分资源。`, 'warning')
      } else {
        addLog(`背包负重过高，采集效率下降 ${penaltyPercent}%。`, 'warning')
      }
    }

    const effects = actionEffects[action]
    const resourcePenalty = isGatherAction ? info.penaltyMultiplier : 1
    applyEffects(effects, resourcePenalty)
    state.value.turn++

    addLog(`第 ${state.value.turn} 回合：${actionNames[action]}`, 'action')

    const event = getRandomEvent()
    applyEffects(event.effects)

    const eventLogType = event.type === 'good' ? 'good' : event.type === 'bad' ? 'bad' : 'event'
    addLog(event.text, eventLogType)

    checkGameOver()
  }

  function gatherWood() {
    performAction('gatherWood')
  }

  function gatherStone() {
    performAction('gatherStone')
  }

  function hunt() {
    performAction('hunt')
  }

  function drink() {
    performAction('drink')
  }

  function discardWood(amount: number): boolean {
    if (state.value.isGameOver) return false
    if (amount <= 0 || state.value.wood < amount) return false
    state.value.wood -= amount
    addLog(`整理背包：丢弃了 ${amount} 个木材（${amount * ITEM_WEIGHTS.wood} 重量）`, 'action')
    return true
  }

  function discardStone(amount: number): boolean {
    if (state.value.isGameOver) return false
    if (amount <= 0 || state.value.stone < amount) return false
    state.value.stone -= amount
    addLog(`整理背包：丢弃了 ${amount} 个石头（${amount * ITEM_WEIGHTS.stone} 重量）`, 'action')
    return true
  }

  function autoDiscardTo(targetRatio: number = 0.7): { discardedWood: number; discardedStone: number } {
    if (state.value.isGameOver) return { discardedWood: 0, discardedStone: 0 }

    const targetWeight = Math.floor(state.value.maxCarryCapacity * targetRatio)
    let currentWeight =
      state.value.wood * ITEM_WEIGHTS.wood + state.value.stone * ITEM_WEIGHTS.stone

    if (currentWeight <= targetWeight) return { discardedWood: 0, discardedStone: 0 }

    let discardedWood = 0
    let discardedStone = 0

    while (currentWeight > targetWeight && state.value.wood > 0) {
      state.value.wood--
      discardedWood++
      currentWeight -= ITEM_WEIGHTS.wood
    }

    while (currentWeight > targetWeight && state.value.stone > 0) {
      state.value.stone--
      discardedStone++
      currentWeight -= ITEM_WEIGHTS.stone
    }

    if (discardedWood > 0 || discardedStone > 0) {
      const parts: string[] = []
      if (discardedWood > 0) parts.push(`${discardedWood} 木材`)
      if (discardedStone > 0) parts.push(`${discardedStone} 石头`)
      addLog(`自动整理背包：丢弃了 ${parts.join('、')}，负重降至 ${currentWeight}/${state.value.maxCarryCapacity}`, 'action')
    }

    return { discardedWood, discardedStone }
  }

  function restart() {
    state.value = {
      health: 80,
      hunger: 30,
      thirst: 30,
      wood: 10,
      stone: 5,
      maxCarryCapacity: DEFAULT_MAX_CARRY,
      turn: 0,
      isGameOver: false,
      logs: [],
    }
    logIdCounter = 0
    addLog('你醒来发现自己身处荒野中，需要想办法生存下去...', 'system')
  }

  loadHighScore()
  addLog('你醒来发现自己身处荒野中，需要想办法生存下去...', 'system')

  return {
    state,
    highScore,
    canAct,
    carryInfo,
    canPerformAction,
    gatherWood,
    gatherStone,
    hunt,
    drink,
    discardWood,
    discardStone,
    autoDiscardTo,
    restart,
  }
}
