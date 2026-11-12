import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS, getApiUrl, getImageUrl } from '../../config/api';
import ImageUpload from '../../components/ui/ImageUpload';
import AdminNavigation from '../../components/AdminNavigation';
import logger from '../../utils/logger';
import '../../styles/admin-panel.css';

const ADEIMembersAdmin = () => {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [membersData, setMembersData] = useState([]);
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
    
    fetchMembers();
  }, [token, user, navigate]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const showModalNotification = (message, type = 'success') => {
    setModalNotification({ message, type });
    setTimeout(() => setModalNotification(null), 5000);
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const result = await fetch(API_ENDPOINTS.ADEI_MEMBERS).then(r => r.json());
      const members = result.success && Array.isArray(result.data) 
        ? result.data 
        : (Array.isArray(result) ? result : []);
      
      setMembersData(Array.isArray(members) ? members : []);
    } catch (error) {
      logger.error('Erreur lors du chargement des membres ADEI');
      setMembersData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      role: '',
      email: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) return;

    try {
      const response = await fetch(getApiUrl(`adei-members/${id}`), {
        method: 'DELETE',
        headers: { Authorization: token }
      });

      const result = await response.json();

      if (response.ok) {
        await fetchMembers();
        showNotification(
          result.message || 'Membre supprimé avec succès!',
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || formData.name.trim() === '') {
      showModalNotification('Le nom est requis', 'error');
      return;
    }

    if (!formData.role || formData.role.trim() === '') {
      showModalNotification('Le rôle est requis', 'error');
      return;
    }

    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem
        ? getApiUrl(`adei-members/${editingItem.id || editingItem._id}`)
        : getApiUrl('adei-members');

      if (imageFile) {
        const formDataObj = new FormData();
        
        Object.keys(formData).forEach(key => {
          if (key !== '_id' && key !== 'id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'photo') {
            if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
              formDataObj.append(key, formData[key]);
            }
          }
        });

        formDataObj.append('photo', imageFile);
        formDataObj.append('updateImage', 'true');

        const response = await fetch(url, {
          method,
          headers: { Authorization: token },
          body: formDataObj
        });

        const result = await response.json();

        if (response.ok) {
          await fetchMembers();
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
      } else {
        const cleanedData = { ...formData };
        delete cleanedData._id;
        delete cleanedData.id;
        delete cleanedData.__v;
        delete cleanedData.createdAt;
        delete cleanedData.updatedAt;

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: token
          },
          body: JSON.stringify(cleanedData)
        });

        const result = await response.json();

        if (response.ok) {
          await fetchMembers();
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
      setFormData(prev => ({ ...prev, photo: null }));
    }
  };

  const getCurrentImage = () => {
    return formData.photo || null;
  };

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
                  <h2>{editingItem ? 'Modifier' : 'Ajouter'} un membre ADEI</h2>
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
                    <ImageUpload
                      currentImage={getCurrentImage()}
                      onImageSelect={handleImageSelect}
                      onImageRemove={handleImageRemove}
                      label="Photo"
                      defaultAspectRatio={1} // Force 1:1 aspect ratio for ADEI member photos
                    />
                    
                    {/* Show edited image indicator */}
                    {imageFile && imagePreview && (
                      <div style={{
                        marginTop: 'var(--spacing-sm)',
                        padding: 'var(--spacing-sm)',
                   
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--success)',
                        fontSize: 'var(--font-size-xs)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12l2 2 4-4"/>
                            <circle cx="12" cy="12" r="10"/>
                          </svg>
                          <strong>Image éditée et prête à sauvegarder</strong>
                        </div>
                        <p style={{ margin: '4px 0 0 20px', color: 'var(--text-primary)' }}>
                          Votre image a été modifiée avec succès. Cliquez sur "Sauvegarder" pour appliquer les changements définitivement.
                        </p>
                      </div>
                    )}
                    
                    <div style={{
                      marginTop: 'var(--spacing-sm)',
                      padding: 'var(--spacing-sm)',
                      backgroundColor: 'var(--primary-light)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--primary)',
                      fontSize: 'var(--font-size-xs)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21,15 16,10 5,21"/>
                        </svg>
                        <strong>Format automatique :</strong>
                      </div>
                      <p style={{ margin: '4px 0 0 20px', color: 'var(--text-primary)' }}>
                        Les photos des membres ADEI seront automatiquement recadrées au format carré (1:1) 
                        pour un affichage uniforme dans l'organigramme. Cliquez sur "Modifier" pour éditer une photo existante.
                      </p>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Nom complet</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Prénom Nom"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Rôle</label>
                      <select
                        className="form-select form-input"
                        value={formData.role || ''}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        required
                      >
                        <option value="">Sélectionnez un rôle</option>
                        <option value="President">President</option>
                        <option value="Vice President">Vice President</option>
                        <option value="Secrétaire Générale">Secrétaire Générale</option>
                        <option value="Trésorier">Trésorier</option>
                        <option value="Conseillers">Conseillers</option>
                        <option value="IT Manager">IT Manager</option>
                        <option value="IT Team">IT Team</option>
                        <option value="Représentant des étudiants étrangers">Représentant des étudiants étrangers</option>
                        <option value="Représentant des Lauréats">Représentant des Lauréats</option>
                        <option value="Affaires Administratives">Affaires Administratives</option>
                        <option value="Responsable Media">Responsable Media</option>
                        <option value="Responsable Interne">Responsable Interne</option>
                        <option value="Responsables Sponsoring">Responsables Sponsoring</option>
                        <option value="Responsables Création & Design">Responsables Création & Design</option>
 </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@usmba.ac.ma"
                        required
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

  const filteredData = membersData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.role && item.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <AdminNavigation />
      <div className="admin-panel">
        <div className="admin-header">
          <div className="admin-header-content">
            <div className="admin-title">
              <h1>Gestion des Membres ADEI</h1>
              <p>Gérer les membres du bureau de l'ADEI</p>
            </div>
            <button className="btn-primary" onClick={handleAdd}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Ajouter un membre
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
                placeholder="Rechercher un membre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Rôle</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="loading-cell">Chargement...</td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-cell">
                      {searchTerm ? 'Aucun membre trouvé' : 'Aucun membre disponible'}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((member) => (
                    <tr key={member.id || member._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {member.photo && (
                            <img 
                              src={getImageUrl(member.photo)} 
                              alt={member.name}
                              className="table-image"
                              onError={(e) => { e.target.src = '/images/ADEI.png'; }}
                            />
                          )}
                          {member.name}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary">{member.role}</span>
                      </td>
                      <td>
                        {member.email ? (
                          <a href={`mailto:${member.email}`} className="link">
                            {member.email}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-action-btn edit"
                            onClick={() => handleEdit(member)}
                            title="Modifier ce membre"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            className="admin-action-btn delete"
                            onClick={() => handleDelete(member.id || member._id)}
                            title="Supprimer ce membre"
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

export default ADEIMembersAdmin;