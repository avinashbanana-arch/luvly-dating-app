import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

// A WebView renders a white document when an uncaught React render error
// tears down the root. Keep the error visible to the member and in Logcat
// instead of silently losing the entire app surface.
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Luvly] Unhandled React render error", { error, componentStack: info.componentStack });
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#070711] p-6 text-center text-white">
          <section className="max-w-sm rounded-3xl border border-[#ff9caf]/50 bg-[#080912] p-6 shadow-2xl">
            <h1 className="text-xl font-semibold text-[#ffe1ae]">We couldn’t open Luvly</h1>
            <p className="mt-3 text-sm text-white/70">{this.state.error.message || "An unexpected app error occurred."}</p>
            <button className="mt-6 rounded-xl bg-[#e3135b] px-5 py-3 font-semibold" onClick={() => window.location.reload()}>
              Restart app
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
