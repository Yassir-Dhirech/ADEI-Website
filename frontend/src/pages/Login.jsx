import React, { useState, useContext, useEffect, useId } from 'react';
import { AuthContext } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPageReady(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login(email, password);
    if (result.success) {
      // Rediriger vers /admin si l'utilisateur est admin, sinon vers /
      if (result.user && result.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className={`page-container ${pageReady ? 'fade-in' : ''}`}>
      <div className="content" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        padding: 'var(--spacing-xl)' 
      }}>
        <div className={`auth-card ${pageReady ? 'zoom-in' : ''}`} style={{ 
          animationDelay: '0.2s',
          maxWidth: '500px',
          width: '100%',
          padding: 'var(--spacing-2xl)'
        }}>
          <h2 className="text-primary mt-0 text-center" style={{ marginBottom: 'var(--spacing-xl)' }}>
            Connexion
          </h2>
          
          {error && (
            <div className="message error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor={emailId}>Email</label>
              <input
                id={emailId}
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Votre adresse email"
                autoComplete="email"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor={passwordId}>Mot de passe</label>
              <div className="password-input-container">
                <input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn" 
              disabled={loading}
              style={{ width: '100%', marginBottom: 'var(--spacing-lg)' }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                  Connexion...
                </>
              ) : (
                'SE CONNECTER'
              )}
            </button>
          </form>

          <div style={{ 
            textAlign: 'center',
            borderTop: '1px solid var(--card-border)',
            paddingTop: 'var(--spacing-lg)'
          }}>
            <p style={{ 
              margin: '0 0 var(--spacing-sm) 0', 
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-muted)'
            }}>
              Besoin d'aide ? <a href="mailto:adei_ensa@gmail.com" className="text-primary">Contactez le staff</a>
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: 'var(--font-size-sm)'
            }}>
              <a href="mailto:adei_ensa@gmail.com?subject=Mot de passe oublié" className="text-primary">
                Mot de passe oublié ?
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;