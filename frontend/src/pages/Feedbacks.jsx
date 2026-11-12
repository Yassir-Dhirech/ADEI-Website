import React, { useState, useEffect, useContext } from 'react';
import Typewriter from '../components/ui/Typewriter';
import UserBadges from '../components/ui/UserBadges';
import { API_ENDPOINTS } from '../config/api';
import { AuthContext } from '../AuthContext';

const Feedbacks = () => {
  const { user, token } = useContext(AuthContext);
  const [formData, setFormData] = useState({ name: '', type: 'avis', message: '' });
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [existingFeedbacks, setExistingFeedbacks] = useState([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setPageReady(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Set default name from user when user is available
  useEffect(() => {
    if (user && user.username) {
      setFormData(prev => ({ ...prev, name: user.username }));
    }
  }, [user]);

  // Fetch existing feedbacks
  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.FEEDBACKS_PUBLIC);
        
        if (response.ok) {
          const result = await response.json();
          
          // Gérer la nouvelle structure de réponse de l'API
          if (result.success && Array.isArray(result.data)) {
            setExistingFeedbacks(result.data);
          } else if (Array.isArray(result)) {
            // Fallback pour l'ancien format (si l'API renvoie directement un tableau)
            setExistingFeedbacks(result);
          } else {
            console.error('Format de réponse inattendu:', result);
            setExistingFeedbacks([]);
          }
        } else {
          console.error('Failed to fetch feedbacks:', response.status, response.statusText);
          setExistingFeedbacks([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des feedbacks:', error);
        setExistingFeedbacks([]);
      } finally {
        setFeedbacksLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Add user email from context for backend processing
      const submitData = {
        ...formData,
        email: user.email // Include email for backend but don't show in form
      };

      const res = await fetch(API_ENDPOINTS.FEEDBACKS, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(data.message);
        setFormData({ name: user.username, type: 'avis', message: '' }); // Reset but keep username
        setTimeout(() => setSuccess(''), 5000);
        
        // Refresh feedbacks after successful submission
        const refreshResponse = await fetch(API_ENDPOINTS.FEEDBACKS_PUBLIC);
        if (refreshResponse.ok) {
          const refreshResult = await refreshResponse.json();
          
          // Gérer la nouvelle structure de réponse de l'API
          if (refreshResult.success && Array.isArray(refreshResult.data)) {
            setExistingFeedbacks(refreshResult.data);
          } else if (Array.isArray(refreshResult)) {
            // Fallback pour l'ancien format
            setExistingFeedbacks(refreshResult);
          }
        }
      } else {
        setSuccess(data.message || "Une erreur s'est produite. Veuillez réessayer.");
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSuccess("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

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

  const getTypeLabel = (type) => {
    const types = {
      'avis': 'Avis',
      'recommandation': 'Recommandation',
      'autre': 'Autre'
    };
    return types[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      'avis': '#4CAF50',
      'recommandation': '#2196F3',
      'autre': '#FF9800'
    };
    return colors[type] || '#757575';
  };

  return (
    <div className={`page-container ${pageReady ? 'fade-in' : ''}`}>
      <div
        className="hero"
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/hero-contact.png)` }}
      >
        <div className={`hero-content ${pageReady ? 'slide-up' : ''}`}>
          <h1>
            <Typewriter 
              words={[
                "Vos Feedbacks",
                "Partagez Vos Avis",
                "Vos Suggestions Comptent",
                "Améliorons Ensemble"
              ]} 
              speed={90} 
              delayBetweenWords={2000} 
              cursor={true} 
              cursorChar="|"
              className="typewriter-hero"
            />
          </h1>
          <p>Partagez vos avis, recommandations et suggestions avec nous</p>
        </div>
      </div>

      <div className={`content ${pageReady ? 'fade-in' : ''}`} style={{ animationDelay: '0.2s' }}>
        
        {/* Existing Feedbacks Section */}
        <div className={`card ${pageReady ? 'zoom-in' : ''}`} style={{ animationDelay: '0.3s', marginBottom: 'var(--spacing-3xl)' }}>
          <h2 className="text-primary mt-0">Feedbacks de la Communauté</h2>
          
          {feedbacksLoading ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
              <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto' }}></div>
              <p style={{ marginTop: 'var(--spacing-md)' }}>Chargement des feedbacks...</p>
            </div>
          ) : existingFeedbacks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto var(--spacing-md) auto', display: 'block' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <h3 style={{ margin: '0 0 var(--spacing-sm) 0' }}>Aucun feedback pour le moment</h3>
              <p>Soyez le premier à partager votre avis !</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gap: 'var(--spacing-lg)',
              maxHeight: '600px',
              overflowY: 'auto',
              padding: 'var(--spacing-sm)'
            }}>
              {existingFeedbacks.map((feedback) => (
                <div 
                  key={feedback.id} 
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius)',
                    padding: 'var(--spacing-lg)',
                    backgroundColor: 'var(--card-bg)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: 'var(--spacing-md)',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-sm)'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>
                          {feedback.name}
                        </h4>
                        {feedback.user ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                            <UserBadges user={feedback.user} size="medium" />
                          </div>
                        ) : (
                          <span style={{ 
                            fontSize: '0.8rem', 
                            color: 'var(--text-muted)',
                            fontStyle: 'italic'
                          }}>
                            (feedback anonyme)
                          </span>
                        )}
                      </div>
                      <span 
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          color: 'white',
                          backgroundColor: getTypeColor(feedback.type),
                          marginTop: 'var(--spacing-xs)'
                        }}
                      >
                        {getTypeLabel(feedback.type)}
                      </span>
                    </div>
                    <span style={{ 
                      fontSize: '0.9rem', 
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatDate(feedback.createdAt)}
                    </span>
                  </div>
                  <p style={{ 
                    margin: 0, 
                    lineHeight: '1.6',
                    color: 'var(--text-secondary)'
                  }}>
                    {feedback.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conseil Section - Above the form */}
        <div className={`card ${pageReady ? 'zoom-in' : ''}`} style={{ animationDelay: '0.4s', marginBottom: 'var(--spacing-3xl)' }}>
          <h2 className="text-primary mt-0">💡 Conseil</h2>
          <p>
            Votre feedback est précieux pour nous ! N'hésitez pas à partager vos avis,
            recommandations ou toute autre suggestion pour améliorer nos services.
          </p>
        </div>

        {/* Feedback Form - Only for logged in users */}
        {user ? (
          <div className={`card ${pageReady ? 'zoom-in' : ''}`} style={{ animationDelay: '0.5s', marginBottom: 'var(--spacing-3xl)' }}>
            <h2 className="text-primary mt-0">Envoyez-nous votre feedback</h2>

            {success && (
              <div className={`message ${success.includes('erreur') ? 'error' : 'success'}`}>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Nom d'utilisateur
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Votre nom d'utilisateur"
                  required
                  readOnly
                />
              </div>

              <div className="form-group">
                <label htmlFor="type" className="form-label">
                  Type de feedback
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value="avis">Avis</option>
                  <option value="recommandation">Recommandation</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message" className="form-label">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Partagez votre feedback avec nous..."
                  required
                  style={{ height: '200px', width: '100%' }}
                />
              </div>

              <button
                type="submit"
                className="btn"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer le feedback'
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Login prompt for non-authenticated users */
          <div className={`card text-center ${pageReady ? 'zoom-in' : ''}`} style={{ animationDelay: '0.5s', marginBottom: 'var(--spacing-3xl)' }}>
            <h2 className="text-primary">Connectez-vous pour partager votre feedback</h2>
            <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
              Vous devez être connecté pour pouvoir soumettre un feedback.
            </p>
            <a href="#/login" className="btn">
              Se connecter
            </a>
          </div>
        )}
        {/* Join ADEI - Only for non-logged users */}
        {!user && (
          <section className={`section ${pageReady ? 'slide-up' : ''}`} style={{ marginTop: 'var(--spacing-3xl)', animationDelay: '0.6s' }}>
            <div className="card text-center highlight-card">
              <h2 className="text-primary">Rejoignez l'ADEI</h2>
              <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-xl)' }}>Rejoignez l’ADEI et devenez un acteur de la vie étudiante.
En tant que membre, vous participez aux décisions, proposez des initiatives
et contribuez activement à l’évolution de votre école et de votre communauté.
              </p>
              <div style={{ 
                display: 'flex', 
                gap: 'var(--spacing-md)', 
                justifyContent: 'center', 
                flexWrap: 'wrap' 
              }}>
                <a href="https://forms.gle/UFx4SFxH9uxJAosN9" className="btn">
                  Devenir membre
                </a>
                <a href="#/adei" className="btn secondary">
                  Découvrir l’ADEI
                </a>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Feedbacks;
