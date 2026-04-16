import { Component } from 'react';

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Keep a trace in the console for debugging intermittent runtime crashes.
    // eslint-disable-next-line no-console
    console.error('Runtime error captured by AppErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f0f12] text-zinc-100 flex items-center justify-center px-4">
          <div className="w-full max-w-md card p-6 text-center">
            <h1 className="text-xl font-bold text-white mb-2">Une erreur est survenue</h1>
            <p className="text-sm text-zinc-400 mb-5">Cette page a rencontré un problème inattendu.</p>
            <button type="button" onClick={this.handleReload} className="btn-primary w-full">
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
