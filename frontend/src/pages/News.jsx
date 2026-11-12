import React, { useEffect, useState } from 'react';
import Typewriter from '../components/ui/Typewriter';
import DetailsModal from '../components/DetailsModal';
import { API_ENDPOINTS } from '../config/api';
import { getOrganizerName, handleOrganizerClick } from '../utils/helpers';

const News = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageReady, setPageReady] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.NEWS);
      const result = await response.json();
      
      // Gérer la nouvelle structure de réponse de l'API
      if (result.success && Array.isArray(result.data)) {
        setArticles(result.data);
      } else if (Array.isArray(result)) {
        // Fallback pour l'ancien format
        setArticles(result);
      } else {
        console.error('Format de réponse inattendu:', result);
        setArticles([]);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles([]);
    } finally {
      setLoading(false);
      setTimeout(() => setPageReady(true), 100);
    }
  };

  const handleViewDetails = (article) => {
    setSelectedArticle(article);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedArticle(null);
  };

  const loadMoreArticles = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setCurrentPage(prev => prev + 1);
      setLoadingMore(false);
    }, 500); // Small delay for better UX
  };

  const displayedArticles = articles.slice(0, currentPage * itemsPerPage);
  const hasMoreArticles = displayedArticles.length < articles.length;

  if (loading) {
    return (
      <div className="loading fade-in">
        <div className="spinner"></div>
        Chargement des actualités...
      </div>
    );
  }

  return (
    <div className={`page-container ${pageReady ? 'fade-in' : ''}`}>
      <div
        className="hero"
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/hero-news.png)` }}
      >
        <div className={`hero-content ${pageReady ? 'slide-up' : ''}`}>
          <h1>
            <Typewriter 
              words={[
                "Actualités",
                "Dernières Nouvelles",
                "Restez Informés",
                "Actualités ADEI"
              ]} 
              speed={100} 
              delayBetweenWords={1800} 
              cursor={true} 
              cursorChar="|"
              className="typewriter-hero"
            />
          </h1>
          <p>Restez informés des dernières nouvelles et annonces de l'ADEI</p>
        </div>
      </div>

      <div className={`content ${pageReady ? 'fade-in' : ''}`} style={{ animationDelay: '0.2s' }}>
        {articles && articles.length > 0 ? (
          <>
            <div className="card-grid">
              {displayedArticles.map((article, index) => (
                <div
                  key={article.id || article._id || index}
                  className={`card ${pageReady ? 'slide-up' : ''}`}
                  style={{ animationDelay: pageReady ? `${0.4 + index * 0.1}s` : '0s' }}
                >
                  <h2 className="mt-0">{article.title}</h2>
                  <small className="text-muted">{article.date}</small>
                  <p>{article.content?.substring(0, 150)}...</p>
                  
                  {/* Prominent Organizer Display */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 'var(--spacing-md)',
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                    color: 'white',
                    borderRadius: 'var(--radius-lg)',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: '0 4px 15px rgba(255, 59, 48, 0.3)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleOrganizerClick(article)}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(255, 59, 48, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(255, 59, 48, 0.3)';
                  }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    Publié par {getOrganizerName(article)}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    marginTop: 'var(--spacing-md)',
                    paddingTop: 'var(--spacing-md)',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    <button
                      onClick={() => handleViewDetails(article)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'var(--primary-dark)';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'var(--primary)';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Voir détails
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {hasMoreArticles && (
              <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
                <button
                  onClick={loadMoreArticles}
                  disabled={loadingMore}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 auto',
                    padding: '12px 24px',
                    backgroundColor: loadingMore ? 'var(--bg-secondary)' : 'var(--primary)',
                    color: loadingMore ? 'var(--text-muted)' : 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!loadingMore) {
                      e.target.style.backgroundColor = 'var(--primary-dark)';
                      e.target.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loadingMore) {
                      e.target.style.backgroundColor = 'var(--primary)';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {loadingMore ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid var(--text-muted)',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Chargement...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14"/>
                        <path d="M19 12l-7 7-7-7"/>
                      </svg>
                      Voir plus d'actualités
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="card text-center">
            <h3>Aucune actualité disponible</h3>
            <p>Les actualités apparaîtront ici dès qu'elles seront publiées.</p>
          </div>
        )}
      </div>

      <DetailsModal
        item={selectedArticle}
        type="news"
        isOpen={showModal}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default News;
