import React, { createContext, useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from './config/api';

export const AuthContext = createContext();

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const logout = useCallback(async () => {
    try {
      if (token) {
        await fetch(API_ENDPOINTS.LOGOUT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
    }
  }, [token]);

  // Logout automatique après inactivité
  useEffect(() => {
    if (!token) return;

    const checkInactivity = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity > INACTIVITY_TIMEOUT) {
        logout();
      }
    }, 60000); // Vérifier toutes les minutes

    return () => clearInterval(checkInactivity);
  }, [token, lastActivity, logout]);

  // Mettre à jour l'activité sur les interactions utilisateur
  useEffect(() => {
    if (!token) return;

    const updateActivity = () => setLastActivity(Date.now());
    
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    return () => {
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, [token]);

  useEffect(() => {
    const decodeValidTokenFallback = (rawToken) => {
      try {
        const payload = JSON.parse(atob(rawToken.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          throw new Error('Token expiré');
        }
        setUser({
          id: payload.id,
          username: payload.username,
          email: payload.email,
          role: payload.role,
          is_president: false,
          is_representant: false,
          is_membre_adei: false,
          is_bureau_adei: false
        });
      } catch (error) {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
      }
    };

    if (token && !user) {
      const fetchUserProfile = async () => {
        try {
          const response = await fetch(API_ENDPOINTS.USER_PROFILE, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else if (response.status === 401 || response.status === 403) {
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
          } else {
            decodeValidTokenFallback(token);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          decodeValidTokenFallback(token);
        }
      };
      
      fetchUserProfile();
    } else if (!token) {
      setUser(null);
    }
  }, [token, user]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        setLastActivity(Date.now());
        localStorage.setItem('token', data.token);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Erreur de connexion' };
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(API_ENDPOINTS.USER_PROFILE, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return { success: true, user: userData };
      } else {
        return { success: false, message: 'Erreur lors du rafraîchissement du profil' };
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      return { success: false, message: 'Erreur lors du rafraîchissement du profil' };
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{
      token,
      user,
      login,
      logout,
      refreshUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};