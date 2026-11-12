// Configuration de l'API
const API_BASE_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5001'
    : 'https://api.adei-ensaf.ma'
);

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/login`,
  LOGOUT: `${API_BASE_URL}/api/logout`,

  // Data
  NEWS: `${API_BASE_URL}/api/news`,
  EVENTS: `${API_BASE_URL}/api/events`,
  CLUBS: `${API_BASE_URL}/api/clubs`,
  FILIERES: `${API_BASE_URL}/api/filieres`,
  ADEI_MEMBERS: `${API_BASE_URL}/api/adei-members`,
  PARTNERS: `${API_BASE_URL}/api/partners`,
  USERS: `${API_BASE_URL}/api/users`,
  USER_PROFILE: `${API_BASE_URL}/api/users/me`,

  // User interactions
  FEEDBACKS: `${API_BASE_URL}/api/feedbacks`,
  FEEDBACKS_PUBLIC: `${API_BASE_URL}/api/feedbacks/public`,
};

// Fonction wrapper pour fetch avec headers anti-bot
export const apiFetch = async (url, options = {}) => {
  const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  return fetch(url, mergedOptions);
};

// Fonction utilitaire pour construire les URLs d'API
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}/api/${endpoint}`;
};

// Fonction utilitaire pour construire les URLs d'images robustes
export const getImageUrl = (imagePath, fallback = '/images/default.jpg') => {
  if (!imagePath || typeof imagePath !== 'string') return fallback;
  
  // Normaliser les séparateurs de fichiers (Windows vs Unix)
  const cleanPath = imagePath.replace(/\\/g, '/').trim();
  if (!cleanPath) return fallback;

  // Si c'est déjà une URL absolue ou base64
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('data:')) {
    return cleanPath;
  }

  // Traitement des chemins d'uploads
  if (cleanPath.startsWith('/uploads/')) {
    return `${API_BASE_URL}${cleanPath}`;
  }
  if (cleanPath.startsWith('uploads/')) {
    return `${API_BASE_URL}/${cleanPath}`;
  }

  // Chemins locaux statiques
  if (cleanPath.startsWith('/')) {
    return cleanPath;
  }

  return `/${cleanPath}`;
};

// Gestionnaire d'erreur pour les balises <img> (remplacement automatique des images cassées)
export const handleImageError = (e, fallback = '/images/default.jpg') => {
  if (e && e.target && e.target.src !== fallback) {
    e.target.onerror = null; // Éviter les boucles infinies
    e.target.src = fallback;
  }
};

export default API_BASE_URL;
