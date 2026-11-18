import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { API_ENDPOINTS } from '../config/api';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { token, authLoading, logout } = useContext(AuthContext);
  const [verified, setVerified] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    // If no active session at all, no need to verify
    if (!token) {
      setVerified(true);
      setAuthorized(false);
      return;
    }

    // If admin is not required, active session is enough
    if (!requireAdmin) {
      setVerified(true);
      setAuthorized(true);
      return;
    }

    // For admin routes, verify the role with the server via httpOnly cookie
    const verifyAdmin = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.USER_PROFILE, {
          credentials: 'include'
        });

        if (response.ok) {
          const payload = await response.json();
          const serverUser = payload?.data ?? payload;
          if (serverUser.role === 'admin') {
            setAuthorized(true);
          } else {
            setAuthorized(false);
          }
        } else {
          // Session is invalid or expired — log the user out
          console.warn('Session verification failed — logging out');
          logout();
          setAuthorized(false);
        }
      } catch (error) {
        console.error('Error verifying admin access:', error);
        setAuthorized(false);
      }
      setVerified(true);
    };

    verifyAdmin();
  }, [token, authLoading, requireAdmin, logout]);

  // Show loading while verifying with the server
  if (authLoading || !verified) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        color: 'var(--text-secondary, #888)'
      }}>
        Vérification des autorisations...
      </div>
    );
  }

  // No token → redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Admin required but not authorized → redirect to home
  if (requireAdmin && !authorized) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
