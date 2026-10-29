"use client";

import { Component, ReactNode } from "react";

interface PreviewErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface PreviewErrorBoundaryState {
  hasError: boolean;
}

export class PreviewErrorBoundary extends Component<
  PreviewErrorBoundaryProps,
  PreviewErrorBoundaryState
> {
  state: PreviewErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): PreviewErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
