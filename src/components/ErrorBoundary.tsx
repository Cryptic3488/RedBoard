import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-cream dark:bg-[#1C1C1E] flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-sm text-center">
            <div className="mb-4">
              <span className="font-ui font-black text-4xl tracking-tight text-brand">Red</span>
              <span className="font-ui font-black text-4xl tracking-tight text-near-black dark:text-gray-100">Board</span>
            </div>
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-semibold text-near-black dark:text-gray-100 mb-2">
              Something went wrong
            </h1>
            <p className="font-ui text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
              An unexpected error occurred. Try reloading the page. If the problem persists, contact your administrator.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="font-ui text-sm font-semibold text-white bg-brand hover:bg-brand/90 transition-colors
                         px-6 py-2.5 rounded-xl"
            >
              Reload app
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
