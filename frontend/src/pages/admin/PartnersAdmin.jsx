import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS, getApiUrl, getImageUrl } from '../../config/api';
import ImageUpload from '../../components/ui/ImageUpload';
import AdminNavigation from '../../components/AdminNavigation';
import logger from '../../utils/logger';
import '../../styles/admin-panel.css';

const PartnersAdmin = () => {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [partnersData, setPartnersData] = useState([]);
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
    
    fetchPartners();
  }, [token, user, navigate]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const showModalNotification = (message, type = 'success') => {
    setModalNotification({ message, type });
    setTimeout(() => setModalNotification(null), 5000);
  };

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const result = await fetch(API_ENDPOINTS.PARTNERS).then(r => r.json());
      const partners = result.success && Array.isArray(result.data) 
        ? result.data 
        : (Array.isArray(result) ? result : []);
      
      setPartnersData(Array.isArray(partners) ? partners : []);
    } catch (error) {
      logger.error('Erreur lors du chargement des partenaires');
      setPartnersData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      website: '',
      description: '',
      facebook: '',
      instagram: '',
      whatsapp: '',
      order_display: 0,
      isActive: true
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

  const handleReorder = async (id, direction) => {
    try {
      const response = await fetch(getApiUrl(`partners/${id}/reorder`), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: token 
        },
        body: JSON.stringify({ direction })
      });

      const result = await response.json();

      if (response.ok) {
        await fetchPartners();
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
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce partenaire ?')) return;

    try {
      const response = await fetch(getApiUrl(`partners/${id}`), {
        method: 'DELETE',
        headers: { Authorization: token }
      });

      const result = await response.json();

      if (response.ok) {
        await fetchPartners();
        showNotification(
          result.message || 'Partenaire supprimé avec succès!',
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

    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem
        ? getApiUrl(`partners/${editingItem.id || editingItem._id}`)
        : getApiUrl('partners');

      if (imageFile) {
        const formDataObj = new FormData();
        
        Object.keys(formData).forEach(key => {
          if (key !== '_id' && key !== 'id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'logo') {
            // Skip empty URL fields to avoid validation errors
            if ((key === 'website' || key === 'facebook' || key === 'instagram' || key === 'whatsapp') && !formData[key]) {
              return;
            }
            if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
              formDataObj.append(key, formData[key]);
            }
          }
        });

        formDataObj.append('logo', imageFile);
        formDataObj.append('updateImage', 'true');

        const response = await fetch(url, {
          method,
          headers: { Authorization: token },
          body: formDataObj
        });

        const result = await response.json();

        if (response.ok) {
          await fetchPartners();
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

        // Remove empty URL fields to avoid validation errors
        if (!cleanedData.website) delete cleanedData.website;
        if (!cleanedData.facebook) delete cleanedData.facebook;
        if (!cleanedData.instagram) delete cleanedData.instagram;
        if (!cleanedData.whatsapp) delete cleanedData.whatsapp;

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
          await fetchPartners();
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
      setFormData(prev => ({ ...prev, logo: null }));
    }
  };

  const getCurrentImage = () => {
    return formData.logo || null;
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
                  <h2>{editingItem ? 'Modifier' : 'Ajouter'} un partenaire</h2>
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
                      label="Logo"
                    />
                    
                    <div className="form-grid two-cols">
                      <div className="form-group">
                        <label className="form-label">Nom du partenaire</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Nom de l'entreprise/organisation"
                          required
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
                        className="form-textarea"
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Description du partenariat..."
                        rows="4"
                      />
                    </div>

                    {/* Social Media Section */}
                    <div className="form-group">
                      <label className="form-label">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                        </svg>
                        Réseaux sociaux
                      </label>
                      <div className="form-grid three-cols">
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', color: '#1877F2' }}>
                              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                            </svg>
                            Facebook
                          </label>
                          <input
                            type="url"
                            className="form-input"
                            value={formData.facebook || ''}
                            onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                            placeholder="https://facebook.com/page"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', color: '#E4405F' }}>
                              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                              <path d="m16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                            </svg>
                            Instagram
                          </label>
                          <input
                            type="url"
                            className="form-input"
                            value={formData.instagram || ''}
                            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                            placeholder="https://instagram.com/profile"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', color: '#25D366' }}>
                              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                            </svg>
                            WhatsApp
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={formData.whatsapp || ''}
                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                            placeholder="https://wa.me/212600000000 ou +212600000000"
                          />
                        </div>
                      </div>
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px', display: 'block' }}>
                        Pour WhatsApp, vous pouvez utiliser un lien wa.me ou un numéro de téléphone
                      </small>
                    </div>
                    
                    <div className="form-grid two-cols">
                      <div className="form-group">
                        <label className="form-label">Ordre d'affichage</label>
                        <input
                          type="number"
                          className="form-input"
                          value={formData.order_display || 0}
                          onChange={(e) => setFormData({ ...formData, order_display: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Statut</label>
                        <select
                          className="form-select form-input"
                          value={formData.isActive !== undefined ? formData.isActive : true}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                        >
                          <option value={true}>Actif</option>
                          <option value={false}>Inactif</option>
                        </select>
                      </div>
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

  const filteredData = partnersData.filter(item =>
    (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.website && item.website.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <AdminNavigation />
      <div className="admin-panel">
        <div className="admin-header">
          <div className="admin-header-content">
            <div className="admin-title">
              <h1>Gestion des Partenaires</h1>
              <p>Gérer les partenaires et sponsors de l'ADEI</p>
            </div>
            <button className="btn-primary" onClick={handleAdd}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Ajouter un partenaire
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
                placeholder="Rechercher un partenaire..."
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
                  <th>Description</th>
                  <th>Site web</th>
                  <th style={{ textAlign: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#1877F2' }}>
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                  </th>
                  <th style={{ textAlign: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#E4405F' }}>
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <path d="m16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                  </th>
                  <th style={{ textAlign: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#25D366' }}>
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                  </th>
                  <th>Statut</th>
                  <th>Ordre</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="loading-cell">Chargement...</td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-cell">
                      {searchTerm ? 'Aucun partenaire trouvé' : 'Aucun partenaire disponible'}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((partner) => (
                    <tr key={partner.id || partner._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {partner.logo && (
                            <img 
                              src={getImageUrl(partner.logo)} 
                              alt={partner.name}
                              className="table-image"
                              onError={(e) => { e.target.src = '/images/ADEI.png'; }}
                            />
                          )}
                          {partner.name}
                        </div>
                      </td>
                      <td>{partner.description?.substring(0, 50)}{partner.description?.length > 50 ? '...' : ''}</td>
                      <td>
                        {partner.website ? (
                          <a href={partner.website} target="_blank" rel="noopener noreferrer" className="link">
                            Visiter
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      {/* Social Media Columns */}
                      <td style={{ textAlign: 'center' }}>
                        {partner.facebook ? (
                          <a href={partner.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                            </svg>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '18px' }}>-</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {partner.instagram ? (
                          <a href={partner.instagram} target="_blank" rel="noopener noreferrer" style={{ color: '#E4405F' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                              <path d="m16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                            </svg>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '18px' }}>-</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {partner.whatsapp ? (
                          <a 
                            href={partner.whatsapp.startsWith('http') ? partner.whatsapp : `https://wa.me/${partner.whatsapp.replace(/[^0-9]/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: '#25D366' }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                            </svg>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '18px' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${partner.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {partner.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            onClick={() => handleReorder(partner.id || partner._id, 'up')}
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
                            onClick={() => handleReorder(partner.id || partner._id, 'down')}
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
                            onClick={() => handleEdit(partner)}
                            title="Modifier ce partenaire"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            className="admin-action-btn delete"
                            onClick={() => handleDelete(partner.id || partner._id)}
                            title="Supprimer ce partenaire"
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

export default PartnersAdmin;