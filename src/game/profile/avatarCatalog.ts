export interface BubbleShooterAvatarOption {
  readonly id: string
  readonly label: string
  readonly src: string
}

export const BUBBLE_SHOOTER_AVATARS: readonly BubbleShooterAvatarOption[] = Object.freeze(
  Array.from({ length: 10 }, (_, index) => {
    const id = `avatar-${String(index + 1).padStart(2, '0')}`
    return { id, label: `Avatar ${index + 1}`, src: `/avatars/${id}.png` }
  }),
)

export function avatarFor(id: string): BubbleShooterAvatarOption {
  return BUBBLE_SHOOTER_AVATARS.find((avatar) => avatar.id === id) ?? BUBBLE_SHOOTER_AVATARS[0]!
}
