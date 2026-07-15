import { Component, type ErrorInfo, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  public override state: AppErrorBoundaryState = { hasError: false }

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  public override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Bubble Shooter application error', error, info)
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell app-shell--error" role="alert">
          <section className="error-panel">
            <h1>Unable to start the game</h1>
            <p>Reload the page to try again.</p>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
