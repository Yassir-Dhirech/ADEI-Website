import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import Typewriter from '../components/ui/Typewriter';
import AnimatedClubs from '../components/ui/AnimatedClubs';
import { API_ENDPOINTS, getImageUrl, handleImageError } from '../config/api';

const Clubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageReady, setPageReady] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchClubs();
    
    // Nettoyer le scroll au démontage du composant
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const fetchClubs = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CLUBS);
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Handle error responses from API
      if (result.success === false) {
        console.error('API Error:', result.message || result.error);
        setClubs([]);
        return;
      }
      
      // Gérer la nouvelle structure de réponse de l'API
      let clubsData = [];
      if (result.success && Array.isArray(result.data)) {
        clubsData = result.data;
      } else if (Array.isArray(result)) {
        // Fallback pour l'ancien format
        clubsData = result;
      } else {
        console.error('Format de réponse inattendu:', result);
        clubsData = [];
      }
      
      // Parser les données pour s'assurer que activities, achievements, members sont des tableaux
      const parsedClubs = clubsData.map(club => ({
        ...club,
        activities: Array.isArray(club.activities) 
          ? club.activities 
          : (typeof club.activities === 'string' 
              ? (club.activities.trim() ? JSON.parse(club.activities) : [])
              : []),
        achievements: Array.isArray(club.achievements) 
          ? club.achievements 
          : (typeof club.achievements === 'string' 
              ? (club.achievements.trim() ? JSON.parse(club.achievements) : [])
              : []),
        members: typeof club.members === 'number' 
          ? club.members 
          : (typeof club.members === 'string' 
              ? parseInt(club.members) || 0
              : 0),
        socialMedia: typeof club.socialMedia === 'object' && club.socialMedia !== null
          ? club.socialMedia
          : (typeof club.socialMedia === 'string'
              ? (club.socialMedia.trim() ? JSON.parse(club.socialMedia) : {})
              : {})
      }));
      
      setClubs(parsedClubs);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
      setTimeout(() => setPageReady(true), 100);
    }
  }, []);

  const handleShowDetails = (club) => {
    setSelectedClub(club);
    setShowModal(true);
    // Empêcher le scroll de la page en arrière-plan
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedClub(null);
    // Restaurer le scroll de la page
    document.body.style.overflow = 'unset';
  };

  if (loading) {
    return (
      <div className="loading fade-in">
        <div className="spinner"></div>
        Chargement des clubs...
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes pulse-glow {
            0% {
              box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 107, 107, 0.3);
            }
            100% {
              box-shadow: 0 12px 35px rgba(255, 107, 107, 0.6), 0 0 0 6px rgba(255, 255, 255, 1), 0 0 30px rgba(255, 107, 107, 0.5);
            }
          }
          
          @keyframes gradient-shift {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) scale(1);
            }
            50% {
              transform: translateY(-5px) scale(1.02);
            }
          }
        `}
      </style>
      <div className={`page-container ${pageReady ? 'fade-in' : ''}`}>
      <div
        className="hero"
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/hero-clubs.png)` }}
      >
        <div className={`hero-content ${pageReady ? 'slide-up' : ''}`}>
          <h1>
            <Typewriter 
              words={[
                "Clubs Étudiants",
                "Associations Dynamiques",
                "Trouvez Votre Passion",
                "Développez Vos Talents"
              ]} 
              speed={85} 
              delayBetweenWords={2200} 
              cursor={true} 
              cursorChar="|"
              className="typewriter-hero"
            />
          </h1>
          <p>Découvrez nos Clubs dynamiques et rejoignez la communauté qui vous correspond</p>
        </div>
      </div>

      <div className={`content ${pageReady ? 'fade-in' : ''}`} style={{ animationDelay: '0.2s' }}>
        {clubs && clubs.length > 0 ? (
          <>
            {/* Animated Clubs Section */}
            <div className={`clubs-animation-section ${pageReady ? 'fade-in' : ''}`} style={{ 
              marginBottom: 'var(--spacing-3xl)',
              animationDelay: '0.4s'
            }}>
              <div className="section-header" style={{
                textAlign: 'center',
                marginBottom: 'var(--spacing-xl)'
              }}>
                <h2 className="text-primary" style={{ margin: '0 0 var(--spacing-md) 0' }}>Découvrez Nos Clubs</h2>
                <p style={{
                  fontSize: 'var(--font-size-md)',
                  color: 'var(--text-muted)',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  Explorez nos associations étudiantes dynamiques et leurs réseaux sociaux
                </p>
              </div>

              <AnimatedClubs 
                clubs={clubs} 
                autoplay={true}
                className="animated-clubs-section"
              />
            </div>

            {/* Regular Clubs Grid */}
            <div className="section-header" style={{
              textAlign: 'center',
              marginBottom: 'var(--spacing-xl)'
            }}>
              <h2 className="text-primary" style={{ margin: '0 0 var(--spacing-md) 0' }}>Tous Nos Clubs</h2>
              <p style={{
                fontSize: 'var(--font-size-md)',
                color: 'var(--text-muted)',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Informations détaillées sur chaque club étudiant
              </p>
            </div>

            <div className="card-grid">
            {clubs.map((club, index) => (
              <div
                key={club.id || club._id || index}
                className={`club-card ${pageReady ? 'slide-up' : ''}`}
                style={{ 
                  animationDelay: pageReady ? `${0.4 + index * 0.1}s` : '0s',
                  background: 'var(--card-bg)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--spacing-xl)',
                  border: '1px solid var(--card-border)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%' // Assure que toutes les cartes ont la même hauteur
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                }}
              >
                {/* Contenu principal avec image à droite */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 'var(--spacing-lg)', 
                  marginBottom: 'var(--spacing-lg)',
                  flex: 1,
                  position: 'relative'
                }}>
                  {/* Member count badge - positioned at bottom right with effects */}
                  {club.members > 0 && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-15px',
                      right: '-15px',
                      background: 'linear-gradient(135deg, #ff6b6b, #ee5a24, #ff9ff3, #54a0ff)',
                      backgroundSize: '300% 300%',
                      color: 'white',
                      borderRadius: '50%',
                      width: '80px',
                      height: '80px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 25px rgba(255, 107, 107, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 107, 107, 0.3)',
                      border: '3px solid white',
                      zIndex: 10,
                      animation: 'pulse-glow 2s ease-in-out infinite alternate, gradient-shift 4s ease-in-out infinite',
                      transform: 'scale(1)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
                      e.currentTarget.style.boxShadow = '0 12px 35px rgba(255, 107, 107, 0.6), 0 0 0 6px rgba(255, 255, 255, 0.9), 0 0 30px rgba(255, 107, 107, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 107, 107, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 107, 107, 0.3)';
                    }}
                    >
                      <span style={{ 
                        fontSize: '24px', 
                        fontWeight: '900',
                        lineHeight: '1',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                        filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))'
                      }}>
                        {club.members}
                      </span>
                      <span style={{ 
                        fontSize: '11px', 
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        lineHeight: '1',
                        fontWeight: '700',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        marginTop: '2px'
                      }}>
                        {club.members === 1 ? 'membre' : 'membres'}
                      </span>
                    </div>
                  )}

                  <div className="club-card-content-wrapper" style={{ flex: 1 }}>
                    <div className="club-card-info">
                      <h2 className="club-card-title" style={{
                        color: 'var(--color-primary)',
                        margin: 0,
                        marginBottom: 'var(--spacing-md)',
                        fontSize: 'var(--font-size-xl)',
                        fontWeight: 'bold'
                      }}>
                        {club.club}
                      </h2>

                      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <p style={{ margin: '0 0 var(--spacing-xs) 0' }}>
                          <strong>Président :</strong> {club.president}
                        </p>
                        {club.tel && (
                          <p style={{ margin: '0 0 var(--spacing-xs) 0' }}>
                            <strong>Contact :</strong>{' '}
                            <a href={`tel:${club.tel}`} className="text-primary">
                              {club.tel}
                            </a>
                          </p>
                        )}
                        {club.website && (
                          <p style={{ margin: '0 0 var(--spacing-xs) 0' }}>
                            <strong>Site web :</strong>{' '}
                            <a
                              href={club.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary"
                            >
                              Visiter le site
                            </a>
                          </p>
                        )}
                      </div>

                      {club.description && (
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                          <p style={{ 
                            color: 'var(--text-muted)', 
                            lineHeight: '1.5',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            margin: 0
                          }}>
                            {club.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {club.image && (
                    <div className="club-profile-image" style={{ flexShrink: 0 }}>
                      <img
                        src={getImageUrl(club.image)}
                        alt={club.club}
                        style={{
                          width: '120px',
                          height: '120px',
                          objectFit: 'cover',
                          borderRadius: '50%',
                          border: '3px solid var(--color-primary)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}
                        onError={(e) => handleImageError(e)}
                      />
                    </div>
                  )}
                </div>

                {/* Bouton "Voir les détails" centré en bas */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  marginTop: 'auto' // Pousse le bouton vers le bas
                }}>
                  <button 
                    onClick={() => handleShowDetails(club)}
                    className="btn"
                    style={{ 
                      fontSize: 'var(--font-size-sm)',
                      padding: 'var(--spacing-xs) var(--spacing-xl)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Voir les détails
                  </button>
                </div>
              </div>
            ))}
            </div>
          </>
        ) : (
          <div className="card text-center">
            <h3>Aucun club disponible</h3>
            <p>Les clubs étudiants apparaîtront ici dès qu'ils seront enregistrés.</p>
          </div>
        )}
      </div>

      {/* Modal des détails du club */}
      {showModal && selectedClub && createPortal(
        <AnimatePresence>
          <motion.div
            className="club-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2147483647,
              padding: '20px'
            }}
          >
            <motion.div
              className="club-modal-container"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'var(--card-bg)',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '900px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-color)'
              }}
            >
              {/* Header du modal */}
              <div className="club-modal-header">
                <h2>{selectedClub.club}</h2>
                <button
                  onClick={closeModal}
                  className="club-modal-close"
                >
                  ×
                </button>
              </div>

              {/* Contenu du modal */}
              <div className="club-modal-body">
                <div className="club-modal-main-content" style={{ display: 'flex', gap: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
                  {/* Informations principales */}
                  <div className="club-modal-info" style={{ flex: 1 }}>
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                      <h3 style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }}>
                        Informations générales
                      </h3>
                      <p><strong>Président :</strong> {selectedClub.president}</p>
                      <p><strong>Année d'étude :</strong> {selectedClub.annees_etude}</p>
                    </div>

                    {/* Contacts */}
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                      <h3 style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }}>
                        Contacts
                      </h3>
                      <p>
                        <strong>Téléphone :</strong>{' '}
                        <a href={`tel:${selectedClub.tel}`} className="text-primary">
                          {selectedClub.tel}
                        </a>
                      </p>
                      <p>
                        <strong>Email :</strong>{' '}
                        <a href={`mailto:${selectedClub.email}`} className="text-primary">
                          {selectedClub.email}
                        </a>
                      </p>
                      {selectedClub.website && (
                        <p>
                          <strong>Site web :</strong>{' '}
                          <a
                            href={selectedClub.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary"
                          >
                            Visiter le site
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Image du club */}
                  {selectedClub.image && (
                    <div className="club-modal-image" style={{ flexShrink: 0 }}>
                      <img
                        src={getImageUrl(selectedClub.image)}
                        alt={selectedClub.club}
                        style={{
                          width: '200px',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: '50%',
                          border: '4px solid var(--color-primary)',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
                        }}
                        onError={(e) => handleImageError(e)}
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedClub.description && (
                  <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h3 style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }}>
                      Description
                    </h3>
                    <p style={{ lineHeight: '1.6' }}>{selectedClub.description}</p>
                  </div>
                )}

                {/* Activités */}
                {selectedClub.activities && Array.isArray(selectedClub.activities) && selectedClub.activities.length > 0 && (
                  <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h3 style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }}>
                      Activités
                    </h3>
                    <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
                      {selectedClub.activities.map((activity, index) => (
                        <li key={index} style={{ marginBottom: 'var(--spacing-xs)' }}>
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Réalisations */}
                {selectedClub.achievements && Array.isArray(selectedClub.achievements) && selectedClub.achievements.length > 0 && (
                  <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h3 style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }}>
                      Réalisations
                    </h3>
                    <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
                      {selectedClub.achievements.map((achievement, index) => (
                        <li key={index} style={{ marginBottom: 'var(--spacing-xs)' }}>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Nombre de membres */}
                {selectedClub.members > 0 && (
                  <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h3 style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }}>
                      Membres du club
                    </h3>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--spacing-sm)',
                      background: 'var(--bg-secondary)', 
                      padding: 'var(--spacing-md)', 
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--card-border)'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-primary)' }}>
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                          {selectedClub.members}
                        </span>
                        <span style={{ marginLeft: 'var(--spacing-xs)', color: 'var(--text-muted)' }}>
                          {selectedClub.members === 1 ? 'membre' : 'membres'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Réseaux sociaux */}
                {selectedClub.socialMedia && (
                  Object.values(selectedClub.socialMedia).some(url => url && url.trim() !== '') && (
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                      <h3 style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }}>
                        Réseaux sociaux
                      </h3>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '12px' 
                      }}>
                        {selectedClub.socialMedia.facebook && (
                          <a 
                            href={selectedClub.socialMedia.facebook} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              color: '#1877F2',
                              textDecoration: 'none',
                              transition: 'opacity 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Facebook
                          </a>
                        )}
                        
                        {selectedClub.socialMedia.instagram && (
                          <a 
                            href={selectedClub.socialMedia.instagram} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              color: '#E4405F',
                              textDecoration: 'none',
                              transition: 'opacity 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            Instagram
                          </a>
                        )}
                        
                        {selectedClub.socialMedia.linkedin && (
                          <a 
                            href={selectedClub.socialMedia.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              color: '#0A66C2',
                              textDecoration: 'none',
                              transition: 'opacity 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  )
                )}

              </div>

              {/* Footer du modal */}
              <div className="club-modal-footer">
                <button onClick={closeModal} className="btn secondary">
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
    </>
  );
};

export default Clubs;
