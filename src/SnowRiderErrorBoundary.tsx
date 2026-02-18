import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; error?: Error };

/** Catches React errors on /snowrider so they don't crash the app or show the overlay. */
export class SnowRiderErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.warn('[SnowRider] Caught error:', error.message, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="snowrider-page snowrider-error-boundary">
          <a href="/" className="snowrider-back">
            ← Back to Quick Links
          </a>
          <div className="snowrider-error">
            Something went wrong loading the game.
            <br />
            <small>Try refreshing or going back.</small>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
