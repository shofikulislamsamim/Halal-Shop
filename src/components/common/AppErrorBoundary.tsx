import React from 'react';

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'অজানা অ্যাপ্লিকেশন ত্রুটি',
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Halal Shop runtime error:', error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#FAFAF7',
        color: '#1c1917',
        fontFamily: 'Noto Sans Bengali, sans-serif',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '520px',
          background: '#fff',
          border: '1px solid #e7e5e4',
          borderRadius: '18px',
          padding: '28px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,.08)',
        }}>
          <div style={{ fontSize: '42px', marginBottom: '10px' }}>⚠️</div>
          <h1 style={{ margin: '0 0 8px', fontSize: '22px', color: '#064E3B' }}>
            Halal Shop সাময়িকভাবে লোড হতে পারেনি
          </h1>
          <p style={{ margin: '0 0 18px', color: '#57534e', lineHeight: 1.7 }}>
            পেজটি আবার লোড করুন। সমস্যাটি থাকলে নিচের ত্রুটির তথ্য দিয়ে দ্রুত ঠিক করা যাবে।
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              border: 0,
              borderRadius: '10px',
              padding: '10px 18px',
              background: '#065F46',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            আবার লোড করুন
          </button>
          <details style={{ marginTop: '18px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', color: '#78716c' }}>ত্রুটির তথ্য</summary>
            <pre style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              marginTop: '10px',
              padding: '12px',
              background: '#f5f5f4',
              borderRadius: '10px',
              fontSize: '12px',
            }}>{this.state.message}</pre>
          </details>
        </div>
      </div>
    );
  }
}
