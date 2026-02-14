"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="w-3 h-3 rounded-full bg-[#FF2D55] mx-auto mb-4 animate-pulse" />
            <div className="text-xs text-white/55 font-mono tracking-widest uppercase mb-2">
              something went wrong
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-[#39FF14]/60 hover:text-[#39FF14] font-mono transition-colors uppercase tracking-wider"
            >
              [ reload ]
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
