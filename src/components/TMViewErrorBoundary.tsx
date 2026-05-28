import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  language?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class TMViewErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message ?? 'Unknown error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[TMView] Error boundary caught:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const lang = this.props.language ?? 'es';
    const isEn = lang === 'en';

    return (
      <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800">
            {isEn ? 'TMView data unavailable' : 'Datos de TMView no disponibles'}
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            {isEn
              ? 'Could not load IMPI data via TMView. The rest of the analysis remains valid.'
              : 'No se pudo cargar los datos de IMPI vía TMView. El resto del análisis sigue siendo válido.'}
          </p>
        </div>
        <button
          type="button"
          onClick={this.handleRetry}
          className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors shrink-0"
        >
          <RefreshCw size={12} />
          {isEn ? 'Retry' : 'Reintentar'}
        </button>
      </div>
    );
  }
}
