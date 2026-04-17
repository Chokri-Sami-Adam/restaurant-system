import { Component } from 'react';

const errorMessages = {
  en: {
    title: 'An error occurred',
    message: 'This page encountered an unexpected problem.',
    button: 'Reload application'
  },
  fr: {
    title: 'Une erreur est survenue',
    message: 'Cette page a rencontré un problème inattendu.',
    button: 'Recharger l\'application'
  },
  ar: {
    title: 'حدث خطأ',
    message: 'واجهت هذه الصفحة مشكلة غير متوقعة.',
    button: 'إعادة تحميل التطبيق'
  }
};

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

  getLanguage = () => {
    return localStorage.getItem('language') || 'en';
  };

  render() {
    if (this.state.hasError) {
      const lang = this.getLanguage();
      const msgs = errorMessages[lang] || errorMessages.en;
      return (
        <div className="min-h-screen bg-[#0f0f12] text-zinc-100 flex items-center justify-center px-4">
          <div className="w-full max-w-md card p-6 text-center">
            <h1 className="text-xl font-bold text-white mb-2">{msgs.title}</h1>
            <p className="text-sm text-zinc-400 mb-5">{msgs.message}</p>
            <button type="button" onClick={this.handleReload} className="btn-primary w-full">
              {msgs.button}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
