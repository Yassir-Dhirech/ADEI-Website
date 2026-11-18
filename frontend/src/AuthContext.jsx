import React, { createContext, useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from './config/api';

export const AuthContext = createContext();

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Marqueur booléen/chaîne non sensible pour compatibilité avec les pages existantes
  // (le vrai JWT n'est jamais stocké dans localStorage ni accessible en JS)
  const token = user ? 'httpOnly-cookie-session' : null;

  const logout = useCallback(async () => {
    try {
      await fetch(API_ENDPOINTS.LOGOUT, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token'); // Nettoyage éventuel d'anciens tokens legacy
    }
  }, []);

  // Vérification initiale de la session via le cookie httpOnly au chargement
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.USER_PROFILE, {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error verifying session:', error);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkSession();
  }, []);

  // Logout automatique après inactivité
  useEffect(() => {
    if (!user) return;

    const checkInactivity = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity > INACTIVITY_TIMEOUT) {
        logout();
      }
    }, 60000);

    return () => clearInterval(checkInactivity);
  }, [user, lastActivity, logout]);

  // Mettre à jour l'activité sur les interactions utilisateur
  useEffect(() => {
    if (!user) return;

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
  }, [user]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setLastActivity(Date.now());
        localStorage.removeItem('token');
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Erreur de connexion' };
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.USER_PROFILE, {
        credentials: 'include'
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
  }, []);

  return (
    <AuthContext.Provider value={{
      token,
      user,
      authLoading,
      login,
      logout,
      refreshUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
