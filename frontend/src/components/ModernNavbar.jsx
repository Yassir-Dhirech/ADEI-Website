import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { NavIcons } from './NavIcons';

const ModernNavbar = () => {
  const { token, logout, user } = useContext(AuthContext);
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  // Navigation items
  const navItems = [
    { path: '/', label: 'Accueil', icon: NavIcons.Home },
    { path: '/adei', label: 'ADEI', icon: NavIcons.ADEI },
    { path: '/events', label: 'Événements', icon: NavIcons.Events },
    { path: '/clubs', label: 'Clubs', icon: NavIcons.Clubs },
    { path: '/ensa', label: 'ENSA', icon: NavIcons.ADEI },
    { path: '/feedbacks', label: 'Feedbacks', icon: NavIcons.Feedbacks },
  ];

  const getDisplayName = () => {
    if (!token || !user?.username) return null;
    const username = user.username;
    if (username.toLowerCase() === 'admin') {
      return 'Administrateur';
    }
    return username
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const displayName = getDisplayName();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAuthDropdownOpen(false);
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.modern-auth-dropdown')) {
        setIsAuthDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    setIsAuthDropdownOpen(false);
  };

  return (
    <nav className={`modern-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="modern-navbar-container">
        {/* Mobile Menu Button */}
        <button 
          className="modern-mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <span className={`hamburger-line ${isMobileMenuOpen ? 'active' : ''}`}></span>
          <span className={`hamburger-line ${isMobileMenuOpen ? 'active' : ''}`}></span>
          <span className={`hamburger-line ${isMobileMenuOpen ? 'active' : ''}`}></span>
        </button>

        {/* Logo */}
        <Link to="/" className="modern-logo" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="logo-container">
            <img 
              src="/images/ADEI.png" 
              alt="ADEI" 
              className="logo-image"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            
          </div>
        </Link>

        {/* Navigation Links */}
        <div className={`modern-nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="nav-links-container">
            {navItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`modern-nav-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  onMouseEnter={() => setHoveredItem(index)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{ '--delay': `${index * 0.1}s` }}
                >
                  <div className="nav-link-content">
                    <div className="nav-icon">
                      <IconComponent />
                    </div>
                    <span className="nav-text">{item.label}</span>
                    <div className="nav-indicator"></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Auth Section */}
        <div className="modern-auth-section">
          <div className="modern-auth-dropdown">
            <button 
              className="modern-auth-toggle"
              onClick={() => setIsAuthDropdownOpen(!isAuthDropdownOpen)}
              aria-expanded={isAuthDropdownOpen}
            >
              <div className="auth-avatar">
                {token ? (
                  <>
                    <NavIcons.User />
                    <div className="auth-info">
                      <span className="auth-name">{displayName}</span>
                      <span className="auth-status">En ligne</span>
                    </div>
                  </>
                ) : (
                  <>
                    <NavIcons.Login />
                    <div className="auth-info">
                      <span className="auth-name">Connexion</span>
                      <span className="auth-status">Hors ligne</span>
                    </div>
                  </>
                )}
              </div>
              <div className={`auth-arrow ${isAuthDropdownOpen ? 'rotated' : ''}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </div>
            </button>

            <div className={`modern-auth-menu ${isAuthDropdownOpen ? 'open' : ''}`}>
              {token ? (
                <>
                  <Link
                    to="/profile"
                    className="modern-auth-item"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAuthDropdownOpen(false);
                    }}
                  >
                    <NavIcons.Profile />
                    <span>Mon Profil</span>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="modern-auth-item"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsAuthDropdownOpen(false);
                      }}
                    >
                      <NavIcons.Admin />
                      <span>Panneau Admin</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="modern-auth-item logout"
                  >
                    <NavIcons.Logout />
                    <span>Déconnexion</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="modern-auth-item"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAuthDropdownOpen(false);
                  }}
                >
                  <NavIcons.Login />
                  <span>Se connecter</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>
    </nav>
  );
};

export default ModernNavbar;