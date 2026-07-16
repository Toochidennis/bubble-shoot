export function bubbleShooterFlagDisplay(flagOrCode: string | undefined): string {
  const value = flagOrCode?.trim() ?? ''
  if (!/^[A-Za-z]{2}$/.test(value)) return value
  return [...value.toUpperCase()].map((character) => String.fromCodePoint(0x1f1e6 + character.charCodeAt(0) - 65)).join('')
}

