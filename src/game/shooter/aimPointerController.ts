/** Owns the single pointer participating in a natural drag-to-aim gesture. */
export class AimPointerController {
  private activePointerId: number | null = null

  public begin(pointerId: number): boolean {
    if (!Number.isSafeInteger(pointerId) || (this.activePointerId !== null && this.activePointerId !== pointerId)) return false
    this.activePointerId = pointerId
    return true
  }

  public accepts(pointerId: number): boolean {
    return this.activePointerId === pointerId
  }

  public end(pointerId: number): boolean {
    if (!this.accepts(pointerId)) return false
    this.activePointerId = null
    return true
  }

  public cancel(pointerId: number): boolean {
    return this.end(pointerId)
  }

  public reset(): void {
    this.activePointerId = null
  }
}
