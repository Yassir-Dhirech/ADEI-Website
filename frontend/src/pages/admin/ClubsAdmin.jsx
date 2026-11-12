import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS, getApiUrl, getImageUrl } from '../../config/api';
import ImageUpload from '../../components/ui/ImageUpload';
import AdminNavigation from '../../components/AdminNavigation';
import logger from '../../utils/logger';
import '../../styles/admin-panel.css';

const ClubsAdmin = () => {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
    
    fetchClubs();
  }, [token, user, navigate]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const showModalNotification = (message, type = 'success') => {
    setModalNotification({ message, type });
    setTimeout(() => setModalNotification(null), 5000);
  };

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const clubsResult = await fetch(API_ENDPOINTS.CLUBS).then(r => r.json());
      const clubs = clubsResult.success && Array.isArray(clubsResult.data) 
        ? clubsResult.data 
        : (Array.isArray(clubsResult) ? clubsResult : []);
      
      setClubsData(Array.isArray(clubs) ? clubs : []);
    } catch (error) {
      logger.error('Erreur lors du chargement des clubs');
      setClubsData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      club: '',
      president: '',
      annees_etude: '',
      tel: '',
      email: '',
      website: '',
      description: '',
      activities: '',
      achievements: '',
      members: 0,
      facebook: '',
      instagram: '',
      linkedin: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    
    const preparedData = { ...item };
    
    // Convert socialMedia object to separate fields if it exists
    if (preparedData.socialMedia && typeof preparedData.socialMedia === 'object') {
      preparedData.facebook = preparedData.socialMedia.facebook || '';
      preparedData.instagram = preparedData.socialMedia.instagram || '';
      preparedData.linkedin = preparedData.socialMedia.linkedin || '';
    }
    
    // Ensure members is a number
    if (typeof preparedData.members !== 'number') {
      preparedData.members = parseInt(preparedData.members) || 0;
    }
    
    // Handle activities and achievements as text
    if (Array.isArray(preparedData.activities)) {
      preparedData.activities = preparedData.activities.join(', ');
    }
    if (Array.isArray(preparedData.achievements)) {
      preparedData.achievements = preparedData.achievements.join(', ');
    }
    
    setFormData(preparedData);
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce club ?')) return;

    try {
      const response = await fetch(getApiUrl(`clubs/${id}`), {
        method: 'DELETE',
        headers: { Authorization: token }
      });

      const result = await response.json();

      if (response.ok) {
        await fetchClubs();
        showNotification('Club supprimé avec succès!', 'success');
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
        ? getApiUrl(`clubs/${editingItem.id || editingItem._id}`)
        : getApiUrl('clubs');

      const formDataObj = new FormData();
      
      // Add all form fields except files and metadata
      Object.keys(formData).forEach(key => {
        if (key !== '_id' && key !== 'id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'image' && key !== 'socialMedia') {
          if (key === 'members') {
            formDataObj.append(key, parseInt(formData[key]) || 0);
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

      const response = await fetch(url, {
        method,
        headers: { Authorization: token },
        body: formDataObj
      });

      const result = await response.json();

      if (response.ok) {
        await fetchClubs();
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

  const filteredClubs = clubsData.filter(club =>
    club.club?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.president?.toLowerCase().includes(searchTerm.toLowerCase())
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
                  <h2>{editingItem ? 'Modifier' : 'Ajouter'} un club</h2>
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
                        <label className="form-label">Nom du club</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.club || ''}
                          onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                          placeholder="Nom du club"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Président</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.president || ''}
                          onChange={(e) => setFormData({ ...formData, president: e.target.value })}
                          placeholder="Nom du président"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-grid two-cols">
                      <div className="form-group">
                        <label className="form-label">Années d'étude</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.annees_etude || ''}
                          onChange={(e) => setFormData({ ...formData, annees_etude: e.target.value })}
                          placeholder="ex: 1ère, 2ème, 3ème année"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Téléphone</label>
                        <input
                          type="tel"
                          className="form-input"
                          value={formData.tel || ''}
                          onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                          placeholder="+212 6 12 34 56 78"
                        />
                      </div>
                    </div>

                    <div className="form-grid two-cols">
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-input"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Site web</label>
                        <input
                          type="url"
                          className="form-input"
                          value={formData.website || ''}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-input"
                        rows="4"
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Description du club"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Image du club</label>
                      <ImageUpload
                        onImageSelect={handleImageSelect}
                        onImageRemove={handleImageRemove}
                        currentImage={getCurrentImage()}
                        imagePreview={imagePreview}
                        getImageUrl={getImageUrl}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nombre de membres</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.members || ''}
                        onChange={(e) => setFormData({ ...formData, members: parseInt(e.target.value) || 0 })}
                        placeholder="Nombre de membres du club"
                        min="0"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Réseaux sociaux</label>
                      <div className="form-grid three-cols">
                        <input
                          type="url"
                          className="form-input"
                          placeholder="Facebook URL"
                          value={formData.facebook || ''}
                          onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                        />
                        <input
                          type="url"
                          className="form-input"
                          placeholder="Instagram URL"
                          value={formData.instagram || ''}
                          onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        />
                        <input
                          type="url"
                          className="form-input"
                          placeholder="LinkedIn URL"
                          value={formData.linkedin || ''}
                          onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Activités (séparées par des virgules)</label>
                      <textarea
                        className="form-input"
                        rows="3"
                        value={formData.activities || ''}
                        onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                        placeholder="ex: Ateliers hebdomadaires, Compétitions nationales, Projets collaboratifs"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Réalisations (séparées par des virgules)</label>
                      <textarea
                        className="form-input"
                        rows="3"
                        value={formData.achievements || ''}
                        onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                        placeholder="ex: 1er prix Hackathon 2024, Organisation du Forum annuel"
                      />
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
            <h1>Gestion des Clubs</h1>
            <p>Gérer les clubs étudiants et leurs informations</p>
          </div>
          <button className="btn-primary" onClick={handleAdd}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Ajouter un club
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
              placeholder="Rechercher un club..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Club</th>
                <th>Président</th>
                <th>Contact</th>
                <th>Années d'étude</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="loading-cell">Chargement...</td>
                </tr>
              ) : filteredClubs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-cell">
                    {searchTerm ? 'Aucun club trouvé' : 'Aucun club disponible'}
                  </td>
                </tr>
              ) : (
                filteredClubs.map((club) => (
                  <tr key={club.id || club._id}>
                    <td>
                      <div className="cell-content">
                        <div className="club-info">
                          {club.image && (
                            <img 
                              src={getImageUrl(club.image)} 
                              alt={club.club}
                              className="club-avatar"
                            />
                          )}
                          <div>
                            <strong>{club.club}</strong>
                            {club.description && (
                              <small>{club.description.substring(0, 80)}...</small>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{club.president}</td>
                    <td>
                      <div className="contact-info">
                        {club.email && <div>{club.email}</div>}
                        {club.tel && <div>{club.tel}</div>}
                      </div>
                    </td>
                    <td>
                      <span className="badge">{club.annees_etude || 'Non défini'}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="admin-action-btn edit"
                          onClick={() => handleEdit(club)}
                          title="Modifier ce club"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          className="admin-action-btn delete"
                          onClick={() => handleDelete(club.id || club._id)}
                          title="Supprimer ce club"
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

export default ClubsAdmin;