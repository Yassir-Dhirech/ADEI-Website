import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          minHeight: '50vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h2>Quelque chose s'est mal passé</h2>
          <p>Une erreur inattendue s'est produite. Veuillez rafraîchir la page.</p>
          <button 
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.hash = '#/';
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ff3b30',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Retour à l'accueil
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;