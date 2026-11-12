import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Typewriter from '../components/ui/Typewriter';
import MembersOrgChart from '../components/ui/MembersOrgChart';
import { API_ENDPOINTS, getImageUrl } from '../config/api';
import '../styles/card-animations.css';

const ADEI = () => {
  const [pageReady, setPageReady] = useState(false);
  const [content] = useState({
    title: "Association des Élèves Ingénieurs (ADEI)",
    subtitle: "Votre communauté étudiante au cœur de l'ENSAF",
    sections: [
      {
        title: "Notre Mission",
        content: "L'Association des Élèves Ingénieurs (ADEI) vise à unir les étudiants ingénieurs et à organiser des activités sociales, culturelles et académiques. Nous travaillons à faciliter leur vie étudiante et à offrir des opportunités de développement personnel et professionnel."
      },
      {
        title: "Nos Valeurs",
        content: "L'ADEI prône l'excellence académique, l'esprit d'équipe, l'innovation et la solidarité. Nous croyons en l'importance de créer un environnement inclusif où chaque étudiant peut s'épanouir et développer ses compétences."
      },
      {
        title: "Nos Activités",
        content: "Notre association organise régulièrement des événements, ateliers, conférences et compétitions pour enrichir l'expérience des étudiants et promouvoir un esprit de communauté au sein de l'école. Nous coordonnons également les activités des différents clubs étudiants."
      },
      {
        title: "Gouvernance",
        content: "L'ADEI est dirigée par un bureau exécutif élu démocratiquement par les étudiants. Notre structure organisationnelle favorise la participation active de tous les membres et assure une représentation équitable de toutes les filières."
      }
    ]
  });

  // Partners data
  const [partners, setPartners] = useState([]);

  const [members, setMembers] = useState([]);

  const roleOrder = [
    'President',
    'Vice President',
    'Secrétaire Générale',
    'Trésorier',
    'Conseillers',
    'IT Manager',
    'IT Team',
    'Représentant des étudiants étrangers',
    'Représentant des Lauréats',
    'Affaires Administratives',
    'Responsable Media',
    'Responsable Interne',
    'Responsables Sponsoring',
    'Responsables Création & Design'
  ];

  useEffect(() => {
    const timer = setTimeout(() => setPageReady(true), 200);
    fetchMembers();
    fetchPartners();
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.ADEI_MEMBERS);
      const data = await response.json();
      const sortedMembers = data.sort((a, b) => {
        const indexA = roleOrder.indexOf(a.role);
        const indexB = roleOrder.indexOf(b.role);
        return indexA - indexB;
      });
      setMembers(sortedMembers);
    } catch (error) {
      console.error('Error fetching ADEI members:', error);
      setMembers([]);
    }
  };

  const fetchPartners = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PARTNERS);
      const data = await response.json();
      setPartners(data);
    } catch (error) {
      console.error('Error fetching partners:', error);
      setPartners([]);
    }
  };




  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      rotateX: -15
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const renderMemberCard = (member) => {
    const photoUrl = getImageUrl(member.photo) || '/images/default.jpg';

    return (
      <motion.div
        key={member.id || member._id}
        variants={itemVariants}
        whileHover={{
          y: -8,
          transition: { duration: 0.3 }
        }}
        className="member-card adei-member-card card"
        style={{
          background: 'var(--card-bg)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--card-border)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          width: '100%',
          maxWidth: '320px'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          opacity: 0.1
        }} />

        <div style={{
          position: 'relative',
          marginBottom: 'var(--spacing-lg)'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            overflow: 'hidden',
            margin: '0 auto',
            border: '4px solid var(--primary)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            position: 'relative'
          }}>
            <img
              src={photoUrl}
              alt={member.name}
              className="member-photo adei-member-photo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease',
                position: 'relative'
              }}
              onError={(e) => {
                e.target.src = '/images/default.jpg';
              }}
            />
          </div>
        </div>

        <p style={{
          margin: '0 0 var(--spacing-sm) 0',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--primary)',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {member.role}
        </p>

        <h3 style={{
          margin: '0 0 var(--spacing-md) 0',
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'bold',
          color: 'var(--text-primary)'
        }}>
          {member.name}
        </h3>

        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <a
            href={`mailto:${member.email}`}
            className="contact-email-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              background: 'var(--primary)',
              color: 'white',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              fontSize: 'var(--font-size-sm)',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'var(--primary-dark)';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'var(--primary)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            }}
          >
            Contact
          </a>
        </div>
      </motion.div>
    );
  };

  const renderMembersByHierarchy = () => {
    const hierarchyLevels = [
      {
        roles: ['President', 'Vice President'],
        columns: 2
      },
      {
        roles: ['Secrétaire Générale', 'Trésorier'],
        columns: 2
      },
      {
        roles: ['Conseillers'],
        columns: 3
      },
      {
        roles: ['IT Manager', 'IT Team'],
        columns: 3
      },
      {
        roles: ['Représentant des étudiants étrangers', 'Représentant des Lauréats', 'Affaires Administratives'],
        columns: 3
      },
      {
        roles: ['Responsable Media', 'Responsable Interne'],
        columns: 2
      },
      {
        roles: ['Responsables Sponsoring'],
        columns: 3
      },
      {
        roles: ['Responsables Création & Design'],
        columns: 3
      }
    ];

    return hierarchyLevels.map((level, levelIndex) => {
      const levelMembers = members.filter(m => level.roles.includes(m.role));

      if (levelMembers.length === 0) return null;

      return (
        <motion.div
          key={levelIndex}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{
            width: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--spacing-xl)',
            justifyContent: 'center',
            maxWidth: level.columns === 1 ? '400px' : level.columns === 2 ? '800px' : '1200px',
            margin: '0 auto'
          }}
        >
          {levelMembers.map(member => renderMemberCard(member))}
        </motion.div>
      );
    });
  };

  const renderPartnerCard = (partner) => {
    const logoUrl = getImageUrl(partner.logo) || '/images/ADEI.png';

    return (
      <motion.div
        key={partner.id}
        variants={itemVariants}
        whileHover={{
          y: -5,
          scale: 1.02,
          transition: { duration: 0.3 }
        }}
        className="partner-card"
        style={{
          background: 'var(--card-bg)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-lg)',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--card-border)',
          transition: 'all 0.3s ease',
          cursor: partner.website ? 'pointer' : 'default',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
        onClick={() => {
          if (partner.website) {
            window.open(partner.website, '_blank', 'noopener,noreferrer');
          }
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            overflow: 'hidden',
            margin: '0 auto var(--spacing-md) auto',
            border: '2px solid var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <img
              src={logoUrl}
              alt={partner.name}
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'contain',
                transition: 'transform 0.3s ease'
              }}
              onError={(e) => {
                e.target.src = '/images/ADEI.png';
              }}
            />
          </div>

          <h3 style={{
            margin: '0 0 var(--spacing-sm) 0',
            fontSize: 'var(--font-size-md)',
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            textAlign: 'center',
            lineHeight: '1.3'
          }}>
            {partner.name}
          </h3>

          <p style={{
            margin: '0',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-muted)',
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            {partner.description}
          </p>
        </div>

        {(partner.website || partner.facebook || partner.instagram || partner.whatsapp) && (
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 'var(--spacing-xs)',
              alignItems: 'center'
            }}>
              {partner.website && (
                <a
                  href={partner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    color: 'var(--primary)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  Visiter le site
                </a>
              )}
              
              {/* Social Media Links */}
              {(partner.facebook || partner.instagram || partner.whatsapp) && (
                <div style={{ 
                  display: 'flex', 
                  gap: 'var(--spacing-sm)',
                  marginTop: 'var(--spacing-xs)'
                }}>
                  {partner.facebook && (
                    <a
                      href={partner.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#1877F2',
                        color: 'white',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'scale(1.1)';
                        e.target.style.boxShadow = '0 4px 12px rgba(24, 119, 242, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = 'none';
                      }}
                      title="Facebook"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}

                  {partner.instagram && (
                    <a
                      href={partner.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                        color: 'white',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'scale(1.1)';
                        e.target.style.boxShadow = '0 4px 12px rgba(225, 48, 108, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = 'none';
                      }}
                      title="Instagram"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}

                  {partner.whatsapp && (
                    <a
                      href={partner.whatsapp.startsWith('http') ? partner.whatsapp : `https://wa.me/${partner.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#25D366',
                        color: 'white',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'scale(1.1)';
                        e.target.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = 'none';
                      }}
                      title="WhatsApp"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={`page-container ${pageReady ? 'fade-in' : ''}`}>
      <>
        <div
          className="hero"
          style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/hero-about.png)` }}
        >
          <div className={`hero-content ${pageReady ? 'slide-up' : ''}`}>
            <h1>
              <Typewriter 
                words={[
                  "Association des Élèves Ingénieurs",
                  "ADEI - Votre Communauté",
                  "Excellence et Innovation",
                  "Ensemble vers l'Avenir"
                ]} 
                speed={70} 
                delayBetweenWords={2300} 
                cursor={true} 
                cursorChar="|"
                className="typewriter-hero"
              />
            </h1>
            <p>{content.subtitle}</p>
          </div>
        </div>

        <div className={`content ${pageReady ? 'fade-in' : ''}`} style={{ animationDelay: '0.2s' }}>
          <div className="card-grid">
            {content.sections.map((section, index) => (
              <div key={index} className={`card ${pageReady ? 'slide-up' : ''}`} style={{ animationDelay: pageReady ? `${0.4 + index * 0.1}s` : '0s' }}>
                <h2 className="text-primary mt-0">{section.title}</h2>
                <p>{section.content}</p>
              </div>
            ))}
          </div>

          {/* Members Section */}
          <div className={`members-section ${pageReady ? 'fade-in' : ''}`} style={{ 
            marginTop: 'var(--spacing-3xl)',
            animationDelay: '0.6s'
          }}>
            <div className="section-header" style={{
              textAlign: 'center',
              marginBottom: 'var(--spacing-xl)'
            }}>
              <h2 className="text-primary" style={{ margin: '0 0 var(--spacing-md) 0' }}>Membres de l'ADEI</h2>
            </div>

            {members.length > 0 ? (
              <div>
                {/* Organigramme Section */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: 'var(--spacing-xl)'
                }}>
                  <h3 style={{
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 'bold',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--spacing-lg)'
                  }}>
                    Organigramme ADEI
                  </h3>
                  
                  <p style={{
                    fontSize: 'var(--font-size-md)',
                    color: 'var(--text-muted)',
                    marginBottom: 'var(--spacing-xl)',
                    maxWidth: '600px',
                    margin: '0 auto var(--spacing-xl) auto'
                  }}>
                    Découvrez la structure organisationnelle de l'ADEI
                  </p>
                </div>

                {/* Organigramme Display */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{
                    background: 'var(--card-bg)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--spacing-xl)',
                    border: '1px solid var(--card-border)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <MembersOrgChart 
                    members={members}
                    className="members-orgchart-section"
                  />
                </motion.div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: 'var(--spacing-3xl)',
                background: 'var(--card-bg)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--card-border)'
              }}>
                <p style={{ 
                  color: 'var(--text-muted)',
                  fontSize: 'var(--font-size-lg)',
                  margin: 0
                }}>
                  Aucun membre disponible pour le moment.
                </p>
              </div>
            )}
          </div>

          {/* Partners Section */}
          <div className={`partners-section ${pageReady ? 'fade-in' : ''}`} style={{ 
            marginTop: 'var(--spacing-3xl)',
            animationDelay: '0.8s',
            overflow: 'hidden'
          }}>
            <div className="section-header" style={{
              textAlign: 'center',
              marginBottom: 'var(--spacing-2xl)'
            }}>
              <h2 className="text-primary" style={{ margin: '0 0 var(--spacing-md) 0' }}>Nos Partenaires</h2>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'var(--spacing-xl)',
                maxWidth: '1200px',
                margin: '0 auto'
              }}
            >
              {partners.map(partner => renderPartnerCard(partner))}
            </motion.div>
          </div>
        </div>

      </>
    </div>
  );
};

export default ADEI;