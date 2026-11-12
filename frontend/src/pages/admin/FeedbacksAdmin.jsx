import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS, getApiUrl } from '../../config/api';
import AdminNavigation from '../../components/AdminNavigation';
import logger from '../../utils/logger';
import '../../styles/admin-panel.css';

const FeedbacksAdmin = () => {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [feedbacksData, setFeedbacksData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewingFeedback, setViewingFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (user === null) {
      return;
    }
    
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchFeedbacks();
  }, [token, user, navigate]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: token };
      const result = await fetch(API_ENDPOINTS.FEEDBACKS, { headers }).then(r => r.json());
      const feedbacks = result.success && Array.isArray(result.data) 
        ? result.data 
        : (Array.isArray(result) ? result : []);
      
      setFeedbacksData(Array.isArray(feedbacks) ? feedbacks : []);
    } catch (error) {
      logger.error('Erreur lors du chargement des feedbacks');
      setFeedbacksData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const response = await fetch(getApiUrl(`feedbacks/${id}/read`), {
        method: 'PUT',
        headers: { Authorization: token }
      });

      const result = await response.json();

      if (response.ok) {
        await fetchFeedbacks();
        setViewingFeedback((prev) => (prev && prev.id === id ? { ...prev, read: true } : prev));
        showNotification('Feedback marqué comme lu', 'success');
      } else {
        showNotification(result.message || 'Erreur lors de la mise à jour', 'error');
      }
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du statut');
      showNotification('Erreur lors de la mise à jour du statut', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce feedback ?')) return;

    try {
      const response = await fetch(getApiUrl(`feedbacks/${id}`), {
        method: 'DELETE',
        headers: { Authorization: token }
      });

      const result = await response.json();

      if (response.ok) {
        await fetchFeedbacks();
        closeModal();
        showNotification(
          result.message || 'Feedback supprimé avec succès!',
          'success'
        );
      } else {
        showNotification(
          result.message || 'Erreur lors de la suppression',
          'error'
        );
      }
    } catch (error) {
      logger.error('Erreur lors de la suppression');
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const openFeedbackModal = (feedback) => {
    setViewingFeedback(feedback);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setViewingFeedback(null);
    document.body.style.overflow = 'unset';
  };

  const filteredData = feedbacksData.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                       (item.message && item.message.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterStatus === 'unread') return matchSearch && !item.read;
    if (filterStatus === 'read') return matchSearch && Boolean(item.read);
    return matchSearch;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <AdminNavigation />
      <div className="admin-panel">
        <div className="admin-header">
          <div className="admin-header-content">
            <div className="admin-title">
              <h1>Gestion des Feedbacks</h1>
              <p>Consultez les retours et suggestions des utilisateurs.</p>
            </div>
          </div>
        </div>

        <div className="admin-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Chargement des feedbacks...</p>
            </div>
          ) : (
            <>
              <div className="admin-toolbar">
                <input
                  type="text"
                  className="admin-search"
                  placeholder="Rechercher un feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className="admin-search"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ flex: 0.5 }}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="unread">Non lus</option>
                  <option value="read">Lus</option>
                </select>
              </div>

              {filteredData.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">💬</div>
                  <div className="empty-state-title">Aucun feedback</div>
                  <div className="empty-state-description">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Aucun feedback ne correspond à vos critères de recherche.'
                      : 'Aucun feedback pour le moment.'}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1.5rem' }}>
                  <AnimatePresence>
                    {filteredData.map((feedback, index) => (
                      <motion.div
                        key={feedback.id || feedback._id}
                        className="feedback-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                          background: 'linear-gradient(135deg, var(--black-card) 0%, var(--black-hover) 100%)',
                          border: `1px solid ${!feedback.read ? 'var(--primary)' : 'var(--gray-800)'}`,
                          borderRadius: 'var(--radius-lg)',
                          padding: '1.5rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
                          e.currentTarget.style.borderColor = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.borderColor = !feedback.read ? 'var(--primary)' : 'var(--gray-800)';
                        }}
                        onClick={() => openFeedbackModal(feedback)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '600' }}>
                              {feedback.name}
                            </h3>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--gray-400)', marginBottom: '0.5rem' }}>
                              <a href={`mailto:${feedback.email}`} style={{ color: 'var(--primary)' }}>
                                {feedback.email}
                              </a>
                              <span>•</span>
                              <span>{formatDate(feedback.createdAt)}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {!feedback.read ? (
                              <span className="badge primary" style={{ marginRight: '0.5rem' }}>Nouveau</span>
                            ) : (
                              <span className="badge info">Lu</span>
                            )}
                          </div>
                        </div>
                        
                        <p style={{
                          margin: '0 0 1rem 0',
                          color: 'var(--gray-300)',
                          fontSize: '0.95rem',
                          lineHeight: '1.6',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {feedback.message}
                        </p>

                        {feedback.type && (
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              background: 'var(--primary-light)',
                              color: 'var(--primary)',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.85rem',
                              fontWeight: '500'
                            }}>
                              {feedback.type}
                            </span>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-800)' }}>
                          {!feedback.read && (
                            <button
                              type="button"
                              className="admin-action-btn edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(feedback.id || feedback._id);
                              }}
                              title="Marquer comme lu"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            </button>
                          )}
                          <button
                            className="admin-action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(feedback.id || feedback._id);
                            }}
                            title="Supprimer ce feedback"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              <line x1="10" y1="11" x2="10" y2="17"/>
                              <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {viewingFeedback && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="modal-container"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Détails du Feedback</h2>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>

              <div className="modal-body" onScroll={handleModalScroll}>
                <div className="feedback-details">
                  <div className="form-group">
                    <label className="form-label">Nom</label>
                    <div className="feedback-detail-value">{viewingFeedback.name}</div>
                  </div>

                  <div className="form-grid two-cols">
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <div className="feedback-detail-value">
                        <a href={`mailto:${viewingFeedback.email}`} style={{ color: 'var(--primary)' }}>
                          {viewingFeedback.email}
                        </a>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <div className="feedback-detail-value">{viewingFeedback.type || '-'}</div>
                    </div>
                  </div>

                  <div className="form-grid two-cols">
                    <div className="form-group">
                      <label className="form-label">Statut</label>
                      <div className="feedback-detail-value">
                        {!viewingFeedback.read ? (
                          <span className="badge primary">Non lu</span>
                        ) : (
                          <span className="badge info">Lu</span>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <div className="feedback-detail-value">
                        {formatDate(viewingFeedback.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Message</label>
                    <div style={{
                      padding: '1rem',
                      background: 'var(--black)',
                      border: '1px solid var(--gray-800)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {viewingFeedback.message}
                    </div>
                  </div>

                  {viewingFeedback.response && (
                    <div className="form-group">
                      <label className="form-label">Réponse de l'admin</label>
                      <div style={{
                        padding: '1rem',
                        background: 'var(--black)',
                        border: '1px solid var(--success)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {viewingFeedback.response}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-modal secondary" onClick={closeModal}>Fermer</button>
                {!viewingFeedback.read && (
                  <button
                    type="button"
                    className="btn-modal primary"
                    onClick={() => handleMarkAsRead(viewingFeedback.id || viewingFeedback._id)}
                  >
                    Marquer comme lu
                  </button>
                )}
                <button
                  className="btn-modal delete"
                  onClick={() => handleDelete(viewingFeedback.id || viewingFeedback._id)}
                  style={{
                    background: 'var(--error)',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div
            className={`notification ${notification.type}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 10000 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const handleModalScroll = (e) => {
  const modalBody = e.target;
  if (modalBody.scrollTop > 10) {
    modalBody.classList.add('scrolled');
  } else {
    modalBody.classList.remove('scrolled');
  }
};

export default FeedbacksAdmin;
