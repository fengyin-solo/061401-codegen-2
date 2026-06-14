export interface GameState {
  health: number
  hunger: number
  thirst: number
  wood: number
  stone: number
  maxCarryCapacity: number
  turn: number
  isGameOver: boolean
  logs: LogEntry[]
}

export interface LogEntry {
  id: number
  text: string
  type: 'action' | 'event' | 'system' | 'good' | 'bad' | 'warning'
  turn: number
}

export interface RandomEvent {
  id: string
  text: string
  type: 'good' | 'bad' | 'neutral'
  effects: {
    health?: number
    hunger?: number
    thirst?: number
    wood?: number
    stone?: number
  }
}

export type ActionType = 'gatherWood' | 'gatherStone' | 'hunt' | 'drink'

export interface ActionEffect {
  health?: number
  hunger?: number
  thirst?: number
  wood?: number
  stone?: number
}

export interface CarryInfo {
  currentWeight: number
  maxCapacity: number
  burdenLevel: 'normal' | 'warning' | 'overload'
  burdenRatio: number
  penaltyMultiplier: number
}

export const ITEM_WEIGHTS = {
  wood: 2,
  stone: 3,
} as const
