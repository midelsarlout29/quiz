import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Frontend render error', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="center-page">
          <div className="panel error-panel">
            <h1>Aplikasi gagal dimuat</h1>
            <p>{this.state.error.message || 'Terjadi error pada frontend.'}</p>
            <button className="button primary" onClick={() => window.location.reload()}>
              Muat ulang
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
