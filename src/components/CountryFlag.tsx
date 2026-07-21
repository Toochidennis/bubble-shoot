import { bubbleShooterFlagDisplay } from '../game/catalog/bubbleShooterCatalogFormatting'
import type { BubbleShooterCountryOption } from '../game/catalog/bubbleShooterCatalogTypes'

interface CountryFlagProps {
  readonly country: Pick<BubbleShooterCountryOption, 'code' | 'name' | 'emoji' | 'image'>
  readonly className?: string
}

/**
 * Renders a country flag. Prefers the catalog's SVG flag image (renders on every
 * platform, including Windows where flag emoji fall back to letter pairs), and
 * degrades to the emoji / regional-indicator glyph when no image is available.
 */
export function CountryFlag({ country, className }: CountryFlagProps) {
  const classes = `country-flag${className ? ` ${className}` : ''}`
  if (country.image) {
    return <img className={classes} src={country.image} alt="" loading="lazy" decoding="async" />
  }
  return <span className={`${classes} country-flag--emoji`} aria-hidden="true">{bubbleShooterFlagDisplay(country.emoji ?? country.code)}</span>
}
