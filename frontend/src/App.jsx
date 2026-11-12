import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ModernNavbar from './components/ModernNavbar';
import Footer from './components/Footer';
import FloatingThemeToggle from './components/FloatingThemeToggle';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import News from './pages/News';
import Events from './pages/Events';
import Clubs from './pages/Clubs';
import ENSA from './pages/ENSA';
import ADEI from './pages/ADEI';
import Feedbacks from './pages/Feedbacks';
import Login from './pages/Login';
import Profile from './pages/Profile';

// Lazy Loaded Admin & Heavy Components
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const FilieresAdmin = lazy(() => import('./pages/admin/FilieresAdmin'));
const ClubsAdmin = lazy(() => import('./pages/admin/ClubsAdmin'));
const NewsAdmin = lazy(() => import('./pages/admin/NewsAdmin'));
const EventsAdmin = lazy(() => import('./pages/admin/EventsAdmin'));
const UsersAdmin = lazy(() => import('./pages/admin/UsersAdmin'));
const PartnersAdmin = lazy(() => import('./pages/admin/PartnersAdmin'));
const ADEIMembersAdmin = lazy(() => import('./pages/admin/ADEIMembersAdmin'));
const FeedbacksAdmin = lazy(() => import('./pages/admin/FeedbacksAdmin'));

import './styles/theme.css';
import './styles/floating-theme-toggle.css';
import './styles/modern-navbar.css';

// 404 Page Component
function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      padding: '50px 20px', 
      textAlign: 'center',
      minHeight: '50vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1>404 - Page non trouvée</h1>
      <p>La page que vous recherchez n'existe pas.</p>
      <button 
        type="button"
        onClick={() => navigate('/')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#ff3b30',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        Retour à l'accueil
      </button>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isProfilePage = location.pathname === '/profile';
  const shouldHideFooter = isAdminPage || isProfilePage;

  return (
    <ErrorBoundary>
      <div className="app-container fade-in">
        <ModernNavbar />
        <main className="main-content">
          <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary, #666)' }}>
                Chargement de la page...
              </div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/news" element={<News />} />
              <Route path="/events" element={<Events />} />
              <Route path="/clubs" element={<Clubs />} />
              <Route path="/ensa" element={<ENSA />} />
              <Route path="/adei" element={<ADEI />} />
              <Route path="/feedbacks" element={<Feedbacks />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/filieres" element={
                <ProtectedRoute requireAdmin={true}>
                  <FilieresAdmin />
                </ProtectedRoute>
              } />
              <Route path="/admin/clubs" element={
                <ProtectedRoute requireAdmin={true}>
                  <ClubsAdmin />
                </ProtectedRoute>
              } />
              <Route path="/admin/news" element={
                <ProtectedRoute requireAdmin={true}>
                  <NewsAdmin />
                </ProtectedRoute>
              } />
              <Route path="/admin/events" element={
                <ProtectedRoute requireAdmin={true}>
                  <EventsAdmin />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requireAdmin={true}>
                  <UsersAdmin />
                </ProtectedRoute>
              } />
              <Route path="/admin/partners" element={
                <ProtectedRoute requireAdmin={true}>
                  <PartnersAdmin />
                </ProtectedRoute>
              } />
              <Route path="/admin/adei-members" element={
                <ProtectedRoute requireAdmin={true}>
                  <ADEIMembersAdmin />
                </ProtectedRoute>
              } />
              <Route path="/admin/feedbacks" element={
                <ProtectedRoute requireAdmin={true}>
                  <FeedbacksAdmin />
                </ProtectedRoute>
              } />
              {/* Catch-all route for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        {!shouldHideFooter && <Footer />}
        {!location.pathname.startsWith('/admin') && <FloatingThemeToggle />}
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;