import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/shared/Button";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled application error", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleSoftReset = () => {
    try {
      window.localStorage.removeItem("game-design-os::state");
    } catch {
      // Ignore storage clear failures.
    }
    window.location.assign("/dashboard");
  };

  public render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-slate-900">Application Error</h1>
            <p className="mt-2 text-sm text-slate-600">
              Something unexpected happened. Please reload to continue.
            </p>
            <div className="mt-6 grid gap-2">
              <Button className="w-full" onClick={this.handleReload}>
                Reload App
              </Button>
              <Button className="w-full" variant="ghost" onClick={this.handleSoftReset}>
                Clear Saved State & Retry
              </Button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

