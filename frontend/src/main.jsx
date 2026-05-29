import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          backgroundColor: '#1e293b',
          color: '#f8fafc',
          fontFamily: 'monospace',
          height: '100%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          gap: '16px'
        }}>
          <h2 style={{ color: '#ef4444', fontSize: '20px', fontWeight: 'bold' }}>⚠️ Frontend Error Caught</h2>
          <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#fca5a5' }}>
            {this.state.error && this.state.error.toString()}
          </p>
          <pre style={{ 
            fontSize: '11px', 
            backgroundColor: '#0f172a', 
            padding: '16px', 
            borderRadius: '8px', 
            whiteSpace: 'pre-wrap', 
            color: '#cbd5e1',
            border: '1px solid #334155' 
          }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
          <button 
            style={{ 
              backgroundColor: '#ef4444', 
              color: 'white', 
              padding: '10px 16px', 
              borderRadius: '8px',
              fontWeight: 'bold',
              marginTop: '10px'
            }}
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
