import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS, getApiUrl } from '../../config/api';
import AdminNavigation from '../../components/AdminNavigation';
import logger from '../../utils/logger';
import '../../styles/admin-panel.css';

const UsersAdmin = () => {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [usersData, setUsersData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    
    fetchUsers();
  }, [token, user, navigate]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const showModalNotification = (message, type = 'success') => {
    setModalNotification({ message, type });
    setTimeout(() => setModalNotification(null), 5000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: token };
      const usersResponse = await fetch(API_ENDPOINTS.USERS, { credentials: 'include', headers });
      const payload = await usersResponse.json();
      const users = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
      
      setUsersData(users);
    } catch (error) {
      logger.error('Erreur lors du chargement des utilisateurs');
      setUsersData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    console.log('👤 Ouverture du modal d\'ajout d\'utilisateur');
    setEditingItem(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'user',
      is_president: false,
      is_representant: false,
      is_membre_adei: false,
      is_bureau_adei: false
    });
    setShowModal(true);
    console.log('👤 Modal state set to:', true);
    document.body.style.overflow = 'hidden';
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ 
      ...item,
      password: '' // Ne pas pré-remplir le mot de passe
    });
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const handleDelete = async (id) => {
    const userToDelete = usersData.find(u => u.id === id);
    if (userToDelete) {
      // Prevent deleting the last admin
      if (userToDelete.role === 'admin' && usersData.filter(u => u.role === 'admin').length <= 1) {
        showNotification(
          'Impossible de supprimer le dernier administrateur du système',
          'error'
        );
        return;
      }
      
      // Enhanced confirmation for user deletion
      const confirmMessage = userToDelete.role === 'admin' 
        ? `ATTENTION: Vous êtes sur le point de supprimer l'administrateur "${userToDelete.username}" (${userToDelete.email}).\n\nCette action est irréversible et supprimera définitivement ce compte admin.\n\nÊtes-vous absolument sûr de vouloir continuer ?`
        : `Êtes-vous sûr de vouloir supprimer l'utilisateur "${userToDelete.username}" (${userToDelete.email}) ?\n\nCette action est irréversible.`;
        
      if (!window.confirm(confirmMessage)) return;
    }

    try {
      const response = await fetch(getApiUrl(`users/${id}`), {
        method: 'DELETE',
        headers: { Authorization: token }
      });

      const result = await response.json();

      if (response.ok) {
        await fetchUsers();
        showNotification('Utilisateur supprimé avec succès!', 'success');
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

    // User validation
    if (!formData.username || formData.username.length < 3) {
      showModalNotification(
        'Le nom d\'utilisateur doit contenir au moins 3 caractères',
        'error'
      );
      return;
    }

    // Check for duplicate username
    const existingUserByUsername = usersData.find(user => 
      user.username.toLowerCase() === formData.username?.toLowerCase() && 
      user.id !== editingItem?.id
    );
    if (existingUserByUsername) {
      showModalNotification(
        `Le nom d'utilisateur "${formData.username}" est déjà utilisé`,
        'error'
      );
      return;
    }

    // Check for duplicate email
    const existingUserByEmail = usersData.find(user => 
      user.email.toLowerCase() === formData.email?.toLowerCase() && 
      user.id !== editingItem?.id
    );
    if (existingUserByEmail) {
      showModalNotification(
        `L'adresse email "${formData.email}" est déjà utilisée`,
        'error'
      );
      return;
    }

    // Password validation for new users
    if (!editingItem && (!formData.password || formData.password.length < 6)) {
      showModalNotification(
        'Le mot de passe doit contenir au moins 6 caractères',
        'error'
      );
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      showModalNotification(
        'Veuillez saisir une adresse email valide',
        'error'
      );
      return;
    }

    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem
        ? getApiUrl(`users/${editingItem.id || editingItem._id}`)
        : getApiUrl('users');

      const cleanedData = { ...formData };
      delete cleanedData._id;
      delete cleanedData.id;
      delete cleanedData.__v;
      delete cleanedData.createdAt;
      delete cleanedData.updatedAt;

      // Don't send empty password for updates
      if (editingItem && !cleanedData.password) {
        delete cleanedData.password;
      }

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
        await fetchUsers();
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
    setShowPassword(false);
    setModalNotification(null);
    document.body.style.overflow = 'unset';
  };

  const filteredUsers = usersData.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
                  <h2>{editingItem ? 'Modifier' : 'Ajouter'} un utilisateur</h2>
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
                        <label className="form-label">Nom d'utilisateur</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.username || ''}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          placeholder="Nom d'utilisateur"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-input"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        {editingItem ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
                      </label>
                      <div className="password-input-container">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="form-input"
                          value={formData.password || ''}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder={editingItem ? 'Nouveau mot de passe' : 'Mot de passe'}
                          required={!editingItem}
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                              <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Rôle</label>
                      <select
                        className="form-select form-input"
                        value={formData.role || 'user'}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        required
                      >
                        <option value="user">Utilisateur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        Badges utilisateur
                      </label>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--spacing-md)',
                        padding: 'var(--spacing-md)',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                      }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.is_president || false}
                            onChange={(e) => setFormData({ ...formData, is_president: e.target.checked })}
                            style={{ margin: 0 }}
                          />
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#dc2626' }}>
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <span>Président de club</span>
                          </span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.is_representant || false}
                            onChange={(e) => setFormData({ ...formData, is_representant: e.target.checked })}
                            style={{ margin: 0 }}
                          />
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#2563eb' }}>
                              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                            </svg>
                            <span>Représentant de classe</span>
                          </span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.is_membre_adei || false}
                            onChange={(e) => setFormData({ ...formData, is_membre_adei: e.target.checked })}
                            style={{ margin: 0 }}
                          />
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#059669' }}>
                              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                              <path d="M9 14l2 2 4-4"/>
                            </svg>
                            <span>Membre de l'ADEI</span>
                          </span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.is_bureau_adei || false}
                            onChange={(e) => setFormData({ ...formData, is_bureau_adei: e.target.checked })}
                            style={{ margin: 0 }}
                          />
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#7c3aed' }}>
                              <path d="M3 21h18"/>
                              <path d="M5 21V7l8-4v18"/>
                              <path d="M19 21V11l-6-4"/>
                              <path d="M9 9v.01"/>
                              <path d="M9 12v.01"/>
                              <path d="M9 15v.01"/>
                              <path d="M9 18v.01"/>
                            </svg>
                            <span>Bureau de l'ADEI</span>
                          </span>
                        </label>
                      </div>
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px', display: 'block' }}>
                        Ces badges seront affichés sur le profil de l'utilisateur et ses feedbacks
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
              <h1>Gestion des Utilisateurs</h1>
              <p>Gérer les comptes utilisateurs et leurs permissions</p>
            </div>
            <button className="btn-primary" onClick={handleAdd}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Ajouter un utilisateur
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
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Badges</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="loading-cell">Chargement...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-cell">
                      {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id || user._id}>
                      <td>
                        <div className="cell-content">
                          <strong>{user.username}</strong>
                          <small>Créé le {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</small>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>
                          {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                        </span>
                      </td>
                      <td>
                        <div className="badges-container">
                          {user.is_president ? (
                            <svg className="badge-icon active" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" title="Président de club" style={{ color: '#dc2626' }}>
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          ) : (
                            <svg className="badge-icon inactive" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          )}
                          {user.is_representant ? (
                            <svg className="badge-icon active" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" title="Représentant de classe" style={{ color: '#2563eb' }}>
                              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                            </svg>
                          ) : (
                            <svg className="badge-icon inactive" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                            </svg>
                          )}
                          {user.is_membre_adei ? (
                            <svg className="badge-icon active" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" title="Membre de l'ADEI" style={{ color: '#059669' }}>
                              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                              <path d="M9 14l2 2 4-4"/>
                            </svg>
                          ) : (
                            <svg className="badge-icon inactive" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                              <path d="M9 14l2 2 4-4"/>
                            </svg>
                          )}
                          {user.is_bureau_adei ? (
                            <svg className="badge-icon active" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" title="Bureau de l'ADEI" style={{ color: '#7c3aed' }}>
                              <path d="M3 21h18"/>
                              <path d="M5 21V7l8-4v18"/>
                              <path d="M19 21V11l-6-4"/>
                              <path d="M9 9v.01"/>
                              <path d="M9 12v.01"/>
                              <path d="M9 15v.01"/>
                              <path d="M9 18v.01"/>
                            </svg>
                          ) : (
                            <svg className="badge-icon inactive" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 21h18"/>
                              <path d="M5 21V7l8-4v18"/>
                              <path d="M19 21V11l-6-4"/>
                              <path d="M9 9v.01"/>
                              <path d="M9 12v.01"/>
                              <path d="M9 15v.01"/>
                              <path d="M9 18v.01"/>
                            </svg>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-action-btn edit"
                            onClick={() => handleEdit(user)}
                            title="Modifier cet utilisateur"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            className="admin-action-btn delete"
                            onClick={() => handleDelete(user.id || user._id)}
                            title="Supprimer cet utilisateur"
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

        {/* Badge Guide Section */}
        <div style={{
          marginTop: 'var(--spacing-xl)',
          padding: 'var(--spacing-lg)',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{
            margin: '0 0 var(--spacing-md) 0',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-lg)',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary)' }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            À propos des badges
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-md)',
            fontSize: 'var(--font-size-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#dc2626', flexShrink: 0 }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Président de club:</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                  Dirige un club étudiant
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#2563eb', flexShrink: 0 }}>
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Représentant de classe:</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                  Représente sa classe
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#059669', flexShrink: 0 }}>
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                <path d="M9 14l2 2 4-4"/>
              </svg>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Membre de l'ADEI:</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                  Fait partie de l'association
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#7c3aed', flexShrink: 0 }}>
                <path d="M3 21h18"/>
                <path d="M5 21V7l8-4v18"/>
                <path d="M19 21V11l-6-4"/>
                <path d="M9 9v.01"/>
                <path d="M9 12v.01"/>
                <path d="M9 15v.01"/>
                <path d="M9 18v.01"/>
              </svg>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Bureau de l'ADEI:</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                  Membre du bureau exécutif
                </span>
              </div>
            </div>
          </div>
        </div>

        {renderModal()}
      </div>
    </>
  );
};

export default UsersAdmin;