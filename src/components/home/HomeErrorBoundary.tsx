"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";

interface HomeErrorBoundaryProps {
  children: ReactNode;
}

interface HomeErrorBoundaryState {
  failed: boolean;
}

/**
 * Catches a real failure while reading or rendering library data, so Home
 * shows an ErrorState instead of crashing the page. It never invents errors:
 * it only reacts to something that was actually thrown.
 */
export class HomeErrorBoundary extends Component<
  HomeErrorBoundaryProps,
  HomeErrorBoundaryState
> {
  state: HomeErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): HomeErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Home failed to render", error, info.componentStack);
  }

  private retry = (): void => {
    this.setState({ failed: false });
  };

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <ErrorState
          code="LIBRARY_ERROR"
          title="Gagal memuat library"
          message="Terjadi masalah saat membaca data library kamu. Coba lagi."
          action={
            <Button variant="secondary" onClick={this.retry}>
              Coba lagi
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}
