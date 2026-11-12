import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../../config/api';

const AnimatedClubs = ({
  clubs,
  autoplay = true,
  className = "",
}) => {
  const [active, setActive] = useState(0);

  const handleNext = () => {
    setActive((prev) => (prev + 1) % clubs.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + clubs.length) % clubs.length);
  };

  const isActive = (index) => {
    return index === active;
  };

  useEffect(() => {
    if (autoplay && clubs.length > 1) {
      const interval = setInterval(handleNext, 4000);
      return () => clearInterval(interval);
    }
  }, [autoplay, clubs.length]);

  const randomRotateY = () => {
    return Math.floor(Math.random() * 21) - 10;
  };

  if (!clubs || clubs.length === 0) {
    return null;
  }

  return (
    <div className={`animated-clubs-container ${className}`} style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px',
    }}>
      <div style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '40px',
      }}>
        {/* Section des logos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          justifyItems: 'center'
        }}>
          <div style={{
            position: 'relative',
            height: '320px',
            width: '250px',
            margin: '0 auto'
          }}>
            <AnimatePresence>
              {clubs.map((club, index) => (
                <motion.div
                  key={club.id || club._id || index}
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                    z: -100,
                    rotate: randomRotateY(),
                  }}
                  animate={{
                    opacity: isActive(index) ? 1 : 0.7,
                    scale: isActive(index) ? 1 : 0.95,
                    z: isActive(index) ? 0 : -100,
                    rotate: isActive(index) ? 0 : randomRotateY(),
                    zIndex: isActive(index) ? 999 : clubs.length + 2 - index,
                    y: isActive(index) ? [0, -20, 0] : 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.9,
                    z: 100,
                    rotate: randomRotateY(),
                  }}
                  transition={{
                    duration: 0.4,
                    ease: "easeInOut",
                  }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    transformOrigin: 'bottom',
                  }}
                >
                  <div style={{
                    height: '100%',
                    width: '100%',
                    borderRadius: '24px',
                    background: 'var(--card-bg)',
                    border: '4px solid var(--primary)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}>
                    <img
                      src={getImageUrl(club.logo || club.image) || '/images/default.jpg'}
                      alt={club.name || club.club}
                      style={{
                        maxHeight: '80%',
                        maxWidth: '80%',
                        objectFit: 'contain',
                        objectPosition: 'center',
                      }}
                      onError={(e) => {
                        e.target.src = '/images/default.jpg';
                      }}
                      draggable={false}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Section des informations */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexDirection: 'column',
            padding: '16px 0',
            minHeight: '320px'
          }}>
            <motion.div
              key={active}
              initial={{
                y: 20,
                opacity: 0,
              }}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                y: -20,
                opacity: 0,
              }}
              transition={{
                duration: 0.2,
                ease: "easeInOut",
              }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <h3 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                margin: '0 0 8px 0',
                textAlign: 'center'
              }}>
                {clubs[active].name || clubs[active].club}
              </h3>
              
              <p style={{
                fontSize: '1.1rem',
                color: 'var(--primary)',
                fontWeight: '600',
                margin: '0 0 12px 0',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {clubs[active].president ? `Président: ${clubs[active].president}` : 'Club Étudiant'}
              </p>

              <motion.div style={{
                fontSize: '1.1rem',
                color: 'var(--text-muted)',
                marginTop: '16px',
                textAlign: 'center',
                lineHeight: '1.6'
              }}>
                {/* Social Media Links */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                  marginBottom: '24px',
                  flexWrap: 'wrap'
                }}>
                  {(clubs[active].socialMedia?.facebook || clubs[active].facebook) && (
                    <a
                      href={clubs[active].socialMedia?.facebook || clubs[active].facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: '#1877F2',
                        color: 'white',
                        borderRadius: '20px',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = '0 4px 15px rgba(24, 119, 242, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </a>
                  )}

                  {(clubs[active].socialMedia?.instagram || clubs[active].instagram) && (
                    <a
                      href={clubs[active].socialMedia?.instagram || clubs[active].instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                        color: 'white',
                        borderRadius: '20px',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = '0 4px 15px rgba(225, 48, 108, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      Instagram
                    </a>
                  )}

                  {(clubs[active].socialMedia?.linkedin || clubs[active].linkedin) && (
                    <a
                      href={clubs[active].socialMedia?.linkedin || clubs[active].linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: '#0077B5',
                        color: 'white',
                        borderRadius: '20px',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = '0 4px 15px rgba(0, 119, 181, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      LinkedIn
                    </a>
                  )}

                  {clubs[active].website && (
                    <a
                      href={clubs[active].website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: 'var(--primary)',
                        color: 'white',
                        borderRadius: '20px',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      Website
                    </a>
                  )}
                </div>

                {clubs[active].description && (
                  <motion.p style={{
                    marginTop: '24px',
                    fontStyle: 'italic',
                    color: 'var(--text-muted)',
                    fontSize: '1rem',
                    lineHeight: '1.5',
                    maxHeight: '4.5em', // Limit to about 3 lines
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {clubs[active].description.split(" ").slice(0, 20).map((word, index) => (
                      <motion.span
                        key={index}
                        initial={{
                          filter: "blur(10px)",
                          opacity: 0,
                          y: 5,
                        }}
                        animate={{
                          filter: "blur(0px)",
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          duration: 0.2,
                          ease: "easeInOut",
                          delay: 0.02 * index,
                        }}
                        style={{ display: 'inline-block' }}
                      >
                        {word}&nbsp;
                      </motion.span>
                    ))}
                    {clubs[active].description.split(" ").length > 20 && "..."}
                  </motion.p>
                )}
              </motion.div>
            </motion.div>

            {/* Contrôles de navigation */}
            {clubs.length > 1 && (
              <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
                paddingTop: '48px'
              }}>
                <button
                  onClick={handlePrev}
                  style={{
                    height: '40px',
                    width: '40px',
                    borderRadius: '50%',
                    background: 'var(--card-bg)',
                    border: '2px solid var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    color: 'var(--primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--primary)';
                    e.target.style.color = 'white';
                    e.target.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'var(--card-bg)';
                    e.target.style.color = 'var(--primary)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </button>
                
                <button
                  onClick={handleNext}
                  style={{
                    height: '40px',
                    width: '40px',
                    borderRadius: '50%',
                    background: 'var(--card-bg)',
                    border: '2px solid var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    color: 'var(--primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--primary)';
                    e.target.style.color = 'white';
                    e.target.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'var(--card-bg)';
                    e.target.style.color = 'var(--primary)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Indicateurs de pagination */}
      {clubs.length > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '32px'
        }}>
          {clubs.map((_, index) => (
            <button
              key={index}
              onClick={() => setActive(index)}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: 'none',
                background: isActive(index) ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                opacity: isActive(index) ? 1 : 0.5
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AnimatedClubs;