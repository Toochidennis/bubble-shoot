interface GameIconProps { readonly name: 'home' | 'map' | 'ranking' | 'rewards' | 'settings' | 'chevron' | 'back' | 'play' | 'pause'; readonly size?: number }

export function GameIcon({ name, size = 22 }: GameIconProps) {
  const paths = {
    home: <path d="M3 10.7 12 3l9 7.7v8.8a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-5v6h-5A1.5 1.5 0 0 1 3 19.5Z" />,
    map: <><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z" /><path d="M9 3v16M15 5v16" /></>,
    ranking: <><path d="M5 20v-6h4v6M10 20V5h4v15M15 20v-9h4v9" /><path d="M4 20h16" /></>,
    rewards: <><path d="M4 8h16v12H4zM2 5h20v3H2zM12 5v15" /><path d="M12 5c-4 0-6-1-6-3 0-1.4 1.1-2 2.3-2C10.2 0 12 5 12 5Zm0 0c4 0 6-1 6-3 0-1.4-1.1-2-2.3-2C13.8 0 12 5 12 5Z" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.6v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6v-2.6h.5A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h2.6v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1Z" /></>,
    chevron: <path d="m8 4 8 8-8 8" />,
    back: <path d="m15 5-7 7 7 7" />,
    play: <path d="m8 5 11 7-11 7Z" />,
    pause: <path d="M7 5v14M17 5v14" />,
  } as const
  return <svg className="game-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
