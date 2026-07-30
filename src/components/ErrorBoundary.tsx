import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import ErrorPage from "../pages/system/ErrorPage";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Application error:", error, errorInfo);

    window.dispatchEvent(
      new CustomEvent("app:toast", {
        detail: {
          message: "Terjadi kesalahan pada aplikasi.",
          type: "error",
        },
      }),
    );
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage onRetry={() => window.location.reload()} />;
    }

    return this.props.children;
  }
}
