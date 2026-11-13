export type RewardPlacement = 'level_rescue' | 'color_swap_refill'

type RewardStatus = 'earned' | 'cancelled' | 'failed' | 'unavailable'

interface RewardRequest {
  readonly resolve: (earned: boolean) => void
  readonly timeout: number
}

interface GameHostChannel {
  postMessage(message: string): void
}

declare global {
  interface Window {
    GameHost?: GameHostChannel
  }
}

const BRIDGE_CHANGED_EVENT = 'bubble-shooter:reward-bridge-changed'
const REWARD_TIMEOUT_MS = 120_000
const supportedPlacements = new Set<RewardPlacement>(['level_rescue', 'color_swap_refill'])

class RewardBridgeClient {
  private bridgeToken: string | null = null
  private enabled = false
  private placements = new Set<RewardPlacement>()
  private readonly requests = new Map<string, RewardRequest>()

  public install(): void {
    if (typeof window === 'undefined') return
    const host = window.BubbleShooterHost ?? {
      setLayoutInsets: () => undefined,
      receive: () => undefined,
    }
    host.receive = (message) => this.receive(message)
    window.BubbleShooterHost = host
    this.send({ version: 1, type: 'rewarded.ready' })
  }

  public canRequest(placement: RewardPlacement): boolean {
    return this.enabled && this.placements.has(placement)
  }

  public request(placement: RewardPlacement): Promise<boolean> {
    if (!this.canRequest(placement) || this.bridgeToken === null || this.requests.size > 0) {
      return Promise.resolve(false)
    }

    const requestId = this.createRequestId()
    return new Promise((resolve) => {
      const timeout = window.setTimeout(() => {
        this.requests.delete(requestId)
        resolve(false)
      }, REWARD_TIMEOUT_MS)
      this.requests.set(requestId, { resolve, timeout })
      this.send({
        version: 1,
        type: 'rewarded.request',
        bridgeToken: this.bridgeToken,
        requestId,
        placement,
      })
    })
  }

  private receive(message: unknown): void {
    if (typeof message !== 'object' || message === null || Array.isArray(message)) return
    const data = message as Record<string, unknown>
    if (data.version === 1 && data.type === 'rewarded.capabilities') {
      this.bridgeToken = typeof data.bridgeToken === 'string' ? data.bridgeToken : null
      this.enabled = data.enabled === true && this.bridgeToken !== null
      this.placements = new Set(
        Array.isArray(data.placements)
          ? data.placements.filter((value): value is RewardPlacement =>
              typeof value === 'string' && supportedPlacements.has(value as RewardPlacement),
            )
          : [],
      )
      this.emitChange()
      return
    }

    // LinkSchool's current bridge returns outcomes as {requestId, status}.
    if (typeof data.requestId !== 'string' || !isRewardStatus(data.status)) return
    const pending = this.requests.get(data.requestId)
    if (pending === undefined) {
      this.send({
        version: 1,
        type: 'rewarded.ack',
        bridgeToken: this.bridgeToken,
        requestId: data.requestId,
      })
      return
    }
    window.clearTimeout(pending.timeout)
    this.requests.delete(data.requestId)
    this.send({
      version: 1,
      type: 'rewarded.ack',
      bridgeToken: this.bridgeToken,
      requestId: data.requestId,
    })
    pending.resolve(data.status === 'earned')
  }

  private send(message: Record<string, unknown>): void {
    if (typeof window === 'undefined' || window.GameHost === undefined) return
    try {
      window.GameHost.postMessage(JSON.stringify(message))
    } catch {
      // The game remains playable if the native channel is absent or unavailable.
    }
  }

  private createRequestId(): string {
    const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replaceAll('-', '')
      : Math.random().toString(36).slice(2)
    return `bubble_${Date.now().toString(36)}_${random}`
  }

  private emitChange(): void {
    window.dispatchEvent(new Event(BRIDGE_CHANGED_EVENT))
  }
}

function isRewardStatus(value: unknown): value is RewardStatus {
  return value === 'earned' || value === 'cancelled' || value === 'failed' || value === 'unavailable'
}

export const rewardBridge = new RewardBridgeClient()
export { BRIDGE_CHANGED_EVENT }
