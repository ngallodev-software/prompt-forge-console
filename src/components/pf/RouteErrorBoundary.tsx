import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "./ErrorState";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { error: Error | null; }

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Route error:", error, info);
  }
  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="p-6">
          <ErrorState
            title="Page failed to render"
            message={this.state.error.message}
            onRetry={() => this.setState({ error: null })}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
