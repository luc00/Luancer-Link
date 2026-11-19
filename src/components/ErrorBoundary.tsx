import React from 'react';
import { RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Errore imprevisto nel caricamento dei dati.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F7] text-zinc-900 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-zinc-200 rounded-2xl p-6 space-y-4 text-center shadow-xs">
            <h1 className="font-studio-display text-lg font-bold text-zinc-900">
              Si è verificato un problema di sincronizzazione
            </h1>
            <p className="text-xs text-zinc-600 leading-relaxed break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#5249F5] rounded-xl cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Ricarica la pagina</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
