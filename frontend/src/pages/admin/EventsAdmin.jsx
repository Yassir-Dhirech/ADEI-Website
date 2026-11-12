import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS, getApiUrl, getImageUrl } from '../../config/api';
import ImageUpload from '../../components/ui/ImageUpload';
import AdminNavigation from '../../components/AdminNavigation';
import { getCategoryLabel, CATEGORY_OPTIONS } from '../../utils/helpers';
import logger from '../../utils/logger';
import '../../styles/admin-panel.css';

const EventsAdmin = () => {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [eventsData, setEventsData] = useState([]);
  const [clubsData, setClubsData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [modalNotification, setModalNotification] = useState(null);

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
    
    fetchEvents();
    fetchClubs();
  }, [token, user, navigate]);

  const fetchClubs = async () => {
    try {
      const clubsResult = await fetch(API_ENDPOINTS.CLUBS).then(r => r.json());
      const clubs = clubsResult.success && Array.isArray(clubsResult.data) 
        ? clubsResult.data 
        : (Array.isArray(clubsResult) ? clubsResult : []);
      
      setClubsData(Array.isArray(clubs) ? clubs : []);
    } catch (error) {
      logger.error('Erreur lors du chargement des clubs');
      setClubsData([]);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const showModalNotification = (message, type = 'success') => {
    setModalNotification({ message, type });
    setTimeout(() => setModalNotification(null), 5000);
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const eventsResult = await fetch(API_ENDPOINTS.EVENTS).then(r => r.json());
      const events = eventsResult.success && Array.isArray(eventsResult.data) 
        ? eventsResult.data 
        : (Array.isArray(eventsResult) ? eventsResult : []);
      
      setEventsData(Array.isArray(events) ? events : []);
    } catch (error) {
      logger.error('Erreur lors du chargement des événements');
      setEventsData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      location: '',
      clubId: '',
      organizer: '',
      link: '',
      isActive: true,
      order_display: 0
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    let clubIdValue = item.clubId ? String(item.clubId) : '';
    if (!clubIdValue && item.organizer === 'ADEI') {
      clubIdValue = 'adei';
    } else if (!clubIdValue && item.organizer === 'Administration ENSA Fès') {
      clubIdValue = 'ensa';
    }
    setFormData({ ...item, clubId: clubIdValue });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const handleReorder = async (id, direction) => {
    try {
      const response = await fetch(getApiUrl(`events/${id}/reorder`), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: token 
        },
        body: JSON.stringify({ direction })
      });

      const result = await response.json();

      if (response.ok) {
        await fetchEvents();
        showNotification('Ordre modifié avec succès!', 'success');
      } else {
        showNotification(result.message || 'Erreur lors de la modification de l\'ordre', 'error');
      }
    } catch (error) {
      logger.error('Erreur lors de la modification de l\'ordre');
      showNotification('Erreur lors de la modification de l\'ordre', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    try {
      const response = await fetch(getApiUrl(`events/${id}`), {
        method: 'DELETE',
        headers: { Authorization: token }
      });

      const result = await response.json();

      if (response.ok) {
        await fetchEvents();
        showNotification('Événement supprimé avec succès!', 'success');
      } else {
        showNotification(result.message || 'Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      logger.error('Erreur lors de la suppression');
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem
        ? getApiUrl(`events/${editingItem.id || editingItem._id}`)
        : getApiUrl('events');

      const formDataObj = new FormData();
      
      console.log('📝 Données du formulaire avant traitement:', formData);
      
      // Add all form fields except files and metadata
      Object.keys(formData).forEach(key => {
        if (key !== '_id' && key !== 'id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'image' && key !== 'documentFile' && key !== 'club' && key !== 'clubIds') {
          if (key === 'clubId') {
            // Handle special organizer values
            if (formData[key] === 'adei') {
              formDataObj.append('clubId', 'adei');
              formDataObj.append('organizer', 'ADEI');
            } else if (formData[key] === 'ensa') {
              formDataObj.append('clubId', 'ensa');
              formDataObj.append('organizer', 'Administration ENSA Fès');
            } else if (formData[key]) {
              formDataObj.append(key, formData[key]);
            }
          } else if (key === 'organizer') {
            // Only add custom organizer if no special clubId is selected
            if (formData.clubId !== 'adei' && formData.clubId !== 'ensa' && formData[key]) {
              formDataObj.append(key, formData[key]);
            }
          } else if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
            formDataObj.append(key, formData[key]);
          }
        }
      });

      // Add image file
      if (imageFile) {
        formDataObj.append('image', imageFile);
        formDataObj.append('updateImage', 'true');
      }

      // Add document file
      if (formData.documentFile) {
        formDataObj.append('document', formData.documentFile);
      }

      const response = await fetch(url, {
        method,
        headers: { Authorization: token },
        body: formDataObj
      });

      const result = await response.json();

      if (response.ok) {
        await fetchEvents();
        closeModal();
        showNotification(
          result.message || `${editingItem ? 'Modification' : 'Création'} réussie!`,
          'success'
        );
      } else {
        showModalNotification(
          result.message || `Erreur lors de la ${editingItem ? 'modification' : 'création'}`,
          'error'
        );
      }
    } catch (error) {
      logger.error('Erreur lors de la soumission');
      showModalNotification(
        `Erreur lors de la ${editingItem ? 'modification' : 'création'}`,
        'error'
      );
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
    setImageFile(null);
    setImagePreview(null);
    setModalNotification(null);
    document.body.style.overflow = 'unset';
  };

  const handleImageSelect = (file, preview) => {
    setImageFile(file);
    setImagePreview(preview);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
    if (editingItem) {
      setFormData(prev => ({ ...prev, image: null }));
    }
  };

  const getCurrentImage = () => {
    return formData.image || null;
  };

  const filteredEvents = eventsData.filter(event =>
    event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderModal = () => {
    return (
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="modal-container"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h2>{editingItem ? 'Modifier' : 'Ajouter'} un événement</h2>
                  <button type="button" className="modal-close" onClick={closeModal}>×</button>
                </div>
                
                {modalNotification && (
                  <div className={`modal-notification ${modalNotification.type}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {modalNotification.type === 'success' ? (
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      )}
                    </svg>
                    {modalNotification.message}
                  </div>
                )}
                
                <div className="modal-body">
                  <div className="form-grid">
                    <div className="form-grid two-cols">
                      <div className="form-group">
                        <label className="form-label">Titre</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.title || ''}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Titre de l'événement"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Catégorie</label>
                        <select
                          className="form-select form-input"
                          value={formData.category || ''}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          required
                        >
                          <option value="">Sélectionner une catégorie</option>
                          {CATEGORY_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-grid two-cols">
                      <div className="form-group">
                        <label className="form-label">Date</label>
                        <input
                          type="date"
                          className="form-input"
                          value={formData.date || ''}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Heure</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.time || ''}
                          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                          placeholder="ex: 14:00 - 16:00"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-grid two-cols">
                      <div className="form-group">
                        <label className="form-label">Organisateur (Club)</label>
                        <select
                          className="form-select form-input"
                          value={formData.clubId || ''}
                          onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
                        >
                          <option value="">Sélectionner un organisateur</option>
                          <option value="adei">ADEI</option>
                          <option value="ensa">Administration ENSA Fès</option>
                          {clubsData.map(club => (
                            <option key={club.id} value={club.id}>
                              {club.club}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Organisateur personnalisé (optionnel)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.organizer || ''}
                          onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                          placeholder="ex: Comité d'organisation..."
                          disabled={formData.clubId === 'adei' || formData.clubId === 'ensa'}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Lieu</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.location || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Amphithéâtre, Salle de conférence..."
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-textarea"
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Description détaillée de l'événement..."
                        rows="6"
                        required
                      />
                    </div>

                    <div className="form-grid two-cols">
                      <ImageUpload
                        currentImage={getCurrentImage()}
                        onImageSelect={handleImageSelect}
                        onImageRemove={handleImageRemove}
                        label="Image (optionnelle)"
                      />
                      <div className="form-group">
                        <label className="form-label">Document (optionnel)</label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                          onChange={(e) => setFormData({ ...formData, documentFile: e.target.files[0] })}
                          className="form-input"
                        />
                        {formData.document && (
                          <div style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Document actuel: {formData.document.split('/').pop()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Lien externe (optionnel)</label>
                      <input
                        type="url"
                        className="form-input"
                        value={formData.link || ''}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        placeholder="https://exemple.com/inscription"
                      />
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        Lien vers inscription ou plus d'informations
                      </small>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button type="button" className="btn-modal secondary" onClick={closeModal}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-modal primary">
                    {editingItem ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <>
      <AdminNavigation />
      <div className="admin-panel">
        <div className="admin-header">
          <div className="admin-header-content">
            <div className="admin-title">
              <h1>Gestion des Événements</h1>
              <p>Gérer les événements et activités du site</p>
            </div>
            <button className="btn-primary" onClick={handleAdd}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Ajouter un événement
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`notification ${notification.type}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {notification.type === 'success' ? (
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              )}
            </svg>
            {notification.message}
          </div>
        )}

        <div className="admin-content">
          <div className="admin-controls">
            <div className="search-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Lieu</th>
                  <th>Organisateur</th>
                  <th>Fichiers</th>
                  <th>Ordre</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="loading-cell">Chargement...</td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-cell">
                      {searchTerm ? 'Aucun événement trouvé' : 'Aucun événement disponible'}
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => (
                    <tr key={event.id || event._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {event.image && (
                            <img 
                              src={getImageUrl(event.image)} 
                              alt={event.title}
                              className="table-image"
                            />
                          )}
                          <div>
                            <strong>{event.title}</strong>
                            {event.category && (
                              <div>
                                <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                                  {getCategoryLabel(event.category)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{event.date ? new Date(event.date).toLocaleDateString('fr-FR') : 'Non définie'}</td>
                      <td>{event.time || 'Non définie'}</td>
                      <td>{event.location || 'Non défini'}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '500' }}>
                            {event.organizer || 'Non défini'}
                          </span>
                          {event.club && (
                            <small style={{ color: 'var(--text-muted)' }}>
                              Club: {event.club.club}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {event.image && (
                            <span className="badge badge-info" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '2px' }}>
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21,15 16,10 5,21"/>
                              </svg>
                              Image
                            </span>
                          )}
                          {event.document && (
                            <span className="badge badge-success" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '2px' }}>
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z"/>
                                <polyline points="14,2 14,8 20,8"/>
                              </svg>
                              Doc
                            </span>
                          )}
                          {!event.image && !event.document && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            onClick={() => handleReorder(event.id || event._id, 'up')}
                            style={{
                              background: 'none',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                              padding: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Monter"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="18,15 12,9 6,15"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleReorder(event.id || event._id, 'down')}
                            style={{
                              background: 'none',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                              padding: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Descendre"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6,9 12,15 18,9"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-action-btn edit"
                            onClick={() => handleEdit(event)}
                            title="Modifier cet événement"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            className="admin-action-btn delete"
                            onClick={() => handleDelete(event.id || event._id)}
                            title="Supprimer cet événement"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              <line x1="10" y1="11" x2="10" y2="17"/>
                              <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {renderModal()}
      </div>
    </>
  );
};

export default EventsAdmin;