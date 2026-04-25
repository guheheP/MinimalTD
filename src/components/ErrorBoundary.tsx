import { Component, type ErrorInfo, type ReactNode } from 'react';
import { translate } from '../i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          background: '#111',
          color: '#fbf8f0',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: '0.05em',
            color: '#e63946',
          }}
        >
          {translate('error.title')}
        </div>
        <div style={{ fontSize: 14, opacity: 0.8, maxWidth: 480, textAlign: 'center' }}>
          {translate('error.message')}
        </div>
        {this.state.message && (
          <pre
            style={{
              fontSize: 11,
              opacity: 0.5,
              maxWidth: 480,
              padding: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {this.state.message}
          </pre>
        )}
        <button
          onClick={this.handleReload}
          style={{
            padding: '10px 22px',
            background: '#e63946',
            color: '#fbf8f0',
            border: 'none',
            fontSize: 13,
            letterSpacing: '0.18em',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {translate('error.reload')}
        </button>
      </div>
    );
  }
}
