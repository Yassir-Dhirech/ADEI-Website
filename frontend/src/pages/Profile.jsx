import { useContext, useState, useEffect, useId, useCallback } from 'react';
import { AuthContext } from '../AuthContext';
import { getApiUrl } from '../config/api';
import UserBadges from '../components/ui/UserBadges';
import Typewriter from '../components/ui/Typewriter';

const Profile = () => {
  const { user, token, refreshUserProfile } = useContext(AuthContext);
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const [pageReady, setPageReady] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // États pour la visibilité des mots de passe
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // États pour la validation en temps réel
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    match: false,
    different: false
  });

  // État pour la sécurité du compte
  const [passwordSecurityInfo, setPasswordSecurityInfo] = useState({
    lastChangeDate: null,
    daysAgo: null,
    needsChange: false,
    loading: true
  });

  // Validation en temps réel des mots de passe
  useEffect(() => {
    const newPassword = passwordData.newPassword;
    const confirmPassword = passwordData.confirmPassword;
    const currentPassword = passwordData.currentPassword;
    
    setPasswordValidation({
      length: newPassword.length >= 8,
      match: newPassword === confirmPassword && newPassword.length > 0,
      different: newPassword !== currentPassword && newPassword.length > 0
    });
  }, [passwordData]);

  useEffect(() => {
    const timer = setTimeout(() => setPageReady(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Refresh user profile when component mounts to get latest badge data
  useEffect(() => {
    if (token && refreshUserProfile) {
      refreshUserProfile();
    }
  }, [token, refreshUserProfile]);

  // Charger les informations de sécurité du compte
  useEffect(() => {
    const fetchPasswordSecurityInfo = async () => {
      if (!token) return;
      
      try {
        const response = await fetch(getApiUrl('users/password-security'), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const lastChangeDate = result.data?.lastPasswordChange ? new Date(result.data.lastPasswordChange) : null;
            const now = new Date();
            const daysAgo = lastChangeDate ? Math.floor((now - lastChangeDate) / (1000 * 60 * 60 * 24)) : null;
            const needsChange = daysAgo && daysAgo > 90; // Recommander changement après 90 jours

            setPasswordSecurityInfo({
              lastChangeDate,
              daysAgo,
              needsChange,
              loading: false
            });
          }
        } else {
          // Si l'API n'existe pas encore, on met juste loading à false
          setPasswordSecurityInfo(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.log('Sécurité du compte non disponible');
        setPasswordSecurityInfo(prev => ({ ...prev, loading: false }));
      }
    };

    fetchPasswordSecurityInfo();
  }, [token]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const showModalNotification = (message, type = 'success') => {
    setNotification({ message, type });
    // Ne pas auto-close les notifications modales pour les erreurs
    if (type === 'success') {
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validation côté client
    if (!passwordData.currentPassword.trim()) {
      showModalNotification('Veuillez entrer votre mot de passe actuel', 'error');
      return;
    }
    
    if (!passwordData.newPassword.trim()) {
      showModalNotification('Veuillez entrer un nouveau mot de passe', 'error');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showModalNotification('Les nouveaux mots de passe ne correspondent pas', 'error');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      showModalNotification('Le nouveau mot de passe doit contenir au moins 8 caractères', 'error');
      return;
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      showModalNotification('Le nouveau mot de passe doit être différent de l\'ancien', 'error');
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      const response = await fetch(getApiUrl('users/change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      const result = await response.json();
      console.log('Password change response:', { status: response.status, result });
      
      if (response.ok) {
        showModalNotification('Mot de passe modifié avec succès', 'success');
        
        // Fermer le modal après un délai
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }, 1500);
        
        // Mettre à jour les informations de sécurité
        const now = new Date();
        setPasswordSecurityInfo({
          lastChangeDate: now,
          daysAgo: 0,
          needsChange: false,
          loading: false
        });
      } else {
        showModalNotification(result.message || 'Erreur lors de la modification du mot de passe', 'error');
      }
    } catch (error) {
      console.error('Password change error:', error);
      showModalNotification('Erreur de connexion. Veuillez réessayer.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const closePasswordModal = useCallback(() => {
    setShowPasswordModal(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordValidation({ length: false, match: false, different: false });
    document.body.style.overflow = 'unset';
  }, []);

  useEffect(() => {
    if (!showPasswordModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closePasswordModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPasswordModal, closePasswordModal]);

  if (!user) {
    return (
      <div className="loading fade-in">
        <div className="spinner"></div>
        Chargement du profil...
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`page-container ${pageReady ? 'fade-in' : ''}`}>
      <div
        className="hero"
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/hero-login.png)` }}
      >
        <div className={`hero-content ${pageReady ? 'slide-up' : ''}`}>
          <h1>
            <Typewriter 
              words={[
                "Mon Profil",
                "Mes Informations",
                "Tableau de Bord",
                "Espace Personnel"
              ]} 
              speed={85} 
              delayBetweenWords={2200} 
              cursor={true} 
              cursorChar="|"
              className="typewriter-hero"
            />
          </h1>
          <p>Gérez vos informations personnelles et consultez vos badges</p>
        </div>
      </div>

      <div className={`content ${pageReady ? 'fade-in' : ''}`} style={{ animationDelay: '0.2s' }}>
        <div className="card-grid">
          {/* Profile Information Card */}
          <div className={`card ${pageReady ? 'slide-up' : ''}`} style={{ animationDelay: '0.4s' }}>
            <h2 className="text-primary mt-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Informations du compte
            </h2>
            
            <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  color: 'var(--text-primary)', 
                  marginBottom: 'var(--spacing-xs)' 
                }}>
                  Nom d'utilisateur
                </label>
                <div style={{
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: 'var(--font-size-md)'
                }}>
                  {user.username}
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  color: 'var(--text-primary)', 
                  marginBottom: 'var(--spacing-xs)' 
                }}>
                  Adresse email
                </label>
                <div style={{
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: 'var(--font-size-md)'
                }}>
                  {user.email}
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  color: 'var(--text-primary)', 
                  marginBottom: 'var(--spacing-xs)' 
                }}>
                  Rôle
                </label>
                <div style={{
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: 'var(--font-size-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)'
                }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    backgroundColor: user.role === 'admin' ? '#dc2626' : '#059669',
                    color: 'white'
                  }}>
                    {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {user.role === 'admin' ? 
                      'Accès complet à l\'administration' : 
                      'Accès aux fonctionnalités utilisateur'
                    }
                  </span>
                </div>
              </div>

              <div style={{
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 var(--spacing-xs) 0', color: 'var(--text-primary)' }}>
                    Sécurité du compte
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Modifiez votre mot de passe pour sécuriser votre compte
                  </p>
                  
                  {/* Statut du mot de passe */}
                  <div style={{ marginTop: 'var(--spacing-sm)' }}>
                    {passwordSecurityInfo.loading ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'inline-block', marginRight: '8px' }}>⏳</span>
                        Vérification...
                      </div>
                    ) : passwordSecurityInfo.lastChangeDate ? (
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.85rem',
                          color: passwordSecurityInfo.needsChange ? '#dc2626' : '#059669',
                          fontWeight: '500'
                        }}>
                          {passwordSecurityInfo.needsChange ? (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                              </svg>
                              <span>Changement recommandé</span>
                            </>
                          ) : (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20,6 9,17 4,12"/>
                              </svg>
                              <span>Mot de passe sécurisé</span>
                            </>
                          )}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)',
                          marginTop: '4px',
                          marginLeft: '24px'
                        }}>
                          {passwordSecurityInfo.daysAgo === 0
                            ? 'Modifié aujourd\'hui'
                            : passwordSecurityInfo.daysAgo === 1
                            ? 'Modifié hier'
                            : `Modifié il y a ${passwordSecurityInfo.daysAgo} jours`}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'inline-block', marginRight: '8px' }}>ℹ️</span>
                        Aucun changement enregistré
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPasswordModal(true);
                    document.body.style.overflow = 'hidden';
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  Changer le mot de passe
                </button>
              </div>
            </div>
          </div>

          {/* Badges Card */}
          <div className={`card ${pageReady ? 'slide-up' : ''}`} style={{ animationDelay: '0.6s' }}>
            <h2 className="text-primary mt-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Mes badges
            </h2>
            
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <UserBadges user={user} size="large" />
            </div>

            {(!user.is_president && !user.is_representant && !user.is_membre_adei && !user.is_bureau_adei) && (
              <div style={{
                padding: 'var(--spacing-lg)',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <h3 style={{ color: 'var(--text-muted)', margin: '0 0 var(--spacing-sm) 0' }}>
                  Aucun badge attribué
                </h3>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                  Les badges sont attribués par les administrateurs selon votre rôle dans l'association ou les clubs.
                </p>
              </div>
            )}

            <div style={{
              marginTop: 'var(--spacing-lg)',
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: 'var(--text-primary)' }}>
                À propos des badges
              </h4>
              <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', color: 'var(--text-muted)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#dc2626' }}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span><strong>Président de club:</strong> Vous dirigez un club étudiant</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#2563eb' }}>
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                  <span><strong>Représentant de classe:</strong> Vous représentez votre classe</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#059669' }}>
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                    <path d="M9 14l2 2 4-4"/>
                  </svg>
                  <span><strong>Membre de l'ADEI:</strong> Vous faites partie de l'association</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#7c3aed' }}>
                    <path d="M3 21h18"/>
                    <path d="M5 21V7l8-4v18"/>
                    <path d="M19 21V11l-6-4"/>
                    <path d="M9 9v.01"/>
                    <path d="M9 12v.01"/>
                    <path d="M9 15v.01"/>
                    <path d="M9 18v.01"/>
                  </svg>
                  <span><strong>Bureau de l'ADEI:</strong> Vous êtes membre du bureau exécutif</span>
                </li>
              </ul>
            </div>
          </div>

            
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          color: 'white',
          backgroundColor: notification.type === 'error' ? '#dc2626' : '#059669',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {notification.message}
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div className="modal" style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--spacing-2xl)',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <h3 style={{ 
              margin: '0 0 var(--spacing-xl) 0', 
              color: 'var(--text-primary)',
              textAlign: 'center',
              fontSize: 'var(--font-size-2xl)',
              fontWeight: '700'
            }}>
              Changer le mot de passe
            </h3>
            
            {/* Notification modale */}
            {notification && (
              <div style={{
                marginBottom: 'var(--spacing-lg)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: notification.type === 'error' ? '#fee2e2' : '#f0fdf4',
                border: `1px solid ${notification.type === 'error' ? '#fecaca' : '#86efac'}`,
                color: notification.type === 'error' ? '#dc2626' : '#059669',
                display: 'flex',
                gap: 'var(--spacing-sm)',
                alignItems: 'flex-start'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                  {notification.type === 'error' ? (
                    <>
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </>
                  ) : (
                    <>
                      <polyline points="20,6 9,17 4,12"/>
                      <circle cx="12" cy="12" r="10"/>
                    </>
                  )}
                </svg>
                <span>{notification.message}</span>
              </div>
            )}
            
            <form onSubmit={handlePasswordChange}>
              {/* Mot de passe actuel */}
              <div className="form-group">
                <label className="form-label" htmlFor={currentPasswordId}>
                  Mot de passe actuel
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id={currentPasswordId}
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="form-input"
                    placeholder="Entrez votre mot de passe actuel"
                    autoComplete="current-password"
                    required
                    style={{
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-secondary)',
                      WebkitTextFillColor: 'var(--text-primary)',
                      paddingRight: '50px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label={showCurrentPassword ? "Masquer le mot de passe actuel" : "Afficher le mot de passe actuel"}
                    aria-pressed={showCurrentPassword}
                    style={{
                      position: 'absolute',
                      right: '15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showCurrentPassword ? (
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

              {/* Nouveau mot de passe */}
              <div className="form-group">
                <label className="form-label" htmlFor={newPasswordId}>
                  Nouveau mot de passe
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id={newPasswordId}
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="form-input"
                    placeholder="Entrez le nouveau mot de passe"
                    autoComplete="new-password"
                    required
                    minLength="8"
                    style={{
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-secondary)',
                      WebkitTextFillColor: 'var(--text-primary)',
                      paddingRight: '50px',
                      borderColor: passwordData.newPassword.length > 0 ? 
                        (passwordValidation.length ? 'var(--success)' : 'var(--error)') : 
                        'var(--border-color)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? "Masquer le nouveau mot de passe" : "Afficher le nouveau mot de passe"}
                    aria-pressed={showNewPassword}
                    style={{
                      position: 'absolute',
                      right: '15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showNewPassword ? (
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
                
                {/* Indicateurs de validation pour le nouveau mot de passe */}
                {passwordData.newPassword.length > 0 && (
                  <div style={{ marginTop: 'var(--spacing-sm)' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)',
                      fontSize: '0.85rem',
                      color: passwordValidation.length ? 'var(--success)' : 'var(--error)'
                    }}>
                      {passwordValidation.length ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="15" y1="9" x2="9" y2="15"/>
                          <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                      )}
                      Au moins 8 caractères
                    </div>
                    
                    {passwordData.currentPassword.length > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-xs)',
                        fontSize: '0.85rem',
                        color: passwordValidation.different ? 'var(--success)' : 'var(--error)',
                        marginTop: '4px'
                      }}>
                        {passwordValidation.different ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20,6 9,17 4,12"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                        )}
                        Différent du mot de passe actuel
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Confirmer le nouveau mot de passe */}
              <div className="form-group">
                <label className="form-label" htmlFor={confirmPasswordId}>
                  Confirmer le nouveau mot de passe
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id={confirmPasswordId}
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="form-input"
                    placeholder="Confirmez le nouveau mot de passe"
                    autoComplete="new-password"
                    required
                    minLength="8"
                    style={{
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-secondary)',
                      WebkitTextFillColor: 'var(--text-primary)',
                      paddingRight: '50px',
                      borderColor: passwordData.confirmPassword.length > 0 ? 
                        (passwordValidation.match ? 'var(--success)' : 'var(--error)') : 
                        'var(--border-color)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Masquer la confirmation du mot de passe" : "Afficher la confirmation du mot de passe"}
                    aria-pressed={showConfirmPassword}
                    style={{
                      position: 'absolute',
                      right: '15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showConfirmPassword ? (
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
                
                {/* Indicateur de correspondance */}
                {passwordData.confirmPassword.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    fontSize: '0.85rem',
                    color: passwordValidation.match ? 'var(--success)' : 'var(--error)',
                    marginTop: 'var(--spacing-sm)'
                  }}>
                    {passwordValidation.match ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                    )}
                    {passwordValidation.match ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
                  </div>
                )}
              </div>

              {/* Résumé de validation */}
              {(passwordData.newPassword.length > 0 || passwordData.confirmPassword.length > 0) && (
                <div style={{
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${
                    passwordValidation.length && passwordValidation.match && passwordValidation.different 
                      ? 'var(--success)' 
                      : 'var(--border-color)'
                  }`,
                  marginBottom: 'var(--spacing-lg)'
                }}>
                  <h4 style={{ 
                    margin: '0 0 var(--spacing-sm) 0', 
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)'
                  }}>
                    Validation du mot de passe
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {passwordValidation.length && passwordValidation.match && passwordValidation.different ? (
                      <span style={{ color: 'var(--success)' }}>✓ Tous les critères sont respectés</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>
                        Veuillez respecter tous les critères ci-dessus
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div style={{ 
                display: 'flex', 
                gap: 'var(--spacing-md)', 
                justifyContent: 'flex-end',
                marginTop: 'var(--spacing-xl)'
              }}>
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="btn secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading || !passwordValidation.length || !passwordValidation.match || !passwordValidation.different}
                  className="btn"
                  style={{
                    opacity: (passwordLoading || !passwordValidation.length || !passwordValidation.match || !passwordValidation.different) ? 0.6 : 1,
                    cursor: (passwordLoading || !passwordValidation.length || !passwordValidation.match || !passwordValidation.different) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {passwordLoading ? 'Modification...' : 'Modifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;