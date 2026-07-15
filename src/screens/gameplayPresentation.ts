import type { MissionObjectiveProgress } from '../game/mission/types'
import type { StarThresholds } from '../game/levels/types'

export interface MissionDisplay {
  readonly label: string
  readonly progress: string
  readonly completed: boolean
}

const COLOR_LABELS: Record<string, string> = { blue: 'Blue', green: 'Green', purple: 'Purple', red: 'Red', yellow: 'Yellow' }

export function missionDisplay(progress: MissionObjectiveProgress): MissionDisplay {
  switch (progress.type) {
    case 'CLEAR_ALL_BUBBLES': return { label: 'Clear All', progress: `${progress.remainingBubbleCount ?? progress.remaining} left`, completed: progress.completed }
    case 'POP_COLOR': return { label: `Pop ${COLOR_LABELS[progress.color ?? ''] ?? 'Color'}`, progress: `${progress.progress} / ${progress.target}`, completed: progress.completed }
    case 'DROP_BUBBLES': return { label: 'Drop Bubbles', progress: `${progress.progress} / ${progress.target}`, completed: progress.completed }
    case 'CLEAR_MARKED': return { label: 'Clear Targets', progress: `${progress.progress} / ${progress.target}`, completed: progress.completed }
    case 'REACH_SCORE': return { label: 'Reach Score', progress: `${progress.currentScore ?? progress.progress} / ${progress.target}`, completed: progress.completed }
  }
}

export function starThresholdProgress(score: number, thresholds: StarThresholds): readonly boolean[] {
  return [score >= thresholds.one, score >= thresholds.two, score >= thresholds.three]
}
