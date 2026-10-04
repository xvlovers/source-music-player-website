"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";

interface LibraryErrorBoundaryProps {
  children: ReactNode;
}

interface LibraryErrorBoundaryState {
  failed: boolean;
}

/**
 * Catches a real failure while reading or rendering library data, so a page
 * shows an ErrorState instead of crashing the page. It never invents errors:
 * it only reacts to something that was actually thrown.
 */
export class LibraryErrorBoundary extends Component<
  LibraryErrorBoundaryProps,
  LibraryErrorBoundaryState
> {
  state: LibraryErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): LibraryErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Library data failed to render", error, info.componentStack);
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
