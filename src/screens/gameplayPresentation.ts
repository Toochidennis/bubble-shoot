import type { MissionObjectiveProgress } from '../game/mission/types'
import type { StarThresholds } from '../game/levels/types'
import type { BubbleColor } from '../game/shooter/types'

export interface MissionDisplay {
  readonly label: string
  readonly progress: string
  readonly completed: boolean
  readonly bubbleColor: BubbleColor
}

const COLOR_LABELS: Record<string, string> = { blue: 'Blue', green: 'Green', purple: 'Purple', red: 'Red', yellow: 'Yellow' }

export function missionDisplay(progress: MissionObjectiveProgress): MissionDisplay {
  const remaining = progress.remaining.toLocaleString()
  switch (progress.type) {
    case 'CLEAR_ALL_BUBBLES': return { label: 'Clear All', progress: remaining, completed: progress.completed, bubbleColor: 'blue' }
    case 'POP_COLOR': return { label: `Pop ${COLOR_LABELS[progress.color ?? ''] ?? 'Color'}`, progress: remaining, completed: progress.completed, bubbleColor: progress.color ?? 'blue' }
    case 'DROP_BUBBLES': return { label: 'Drop Bubbles', progress: remaining, completed: progress.completed, bubbleColor: 'green' }
    case 'CLEAR_MARKED': return { label: 'Clear Targets', progress: remaining, completed: progress.completed, bubbleColor: 'purple' }
    case 'REACH_SCORE': return { label: 'Reach Score', progress: remaining, completed: progress.completed, bubbleColor: 'yellow' }
  }
}

export function starThresholdProgress(score: number, thresholds: StarThresholds): readonly boolean[] {
  return [score >= thresholds.one, score >= thresholds.two, score >= thresholds.three]
}
