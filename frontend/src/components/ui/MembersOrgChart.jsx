import React, { useState } from 'react';
import { getImageUrl } from '../../config/api';

const MembersOrgChart = ({ members, className = "" }) => {
  const [hoveredMember, setHoveredMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Custom hierarchy structure as requested
  const hierarchy = {
    directionGenerale: {
      title: 'Direction Générale',
      roles: ['President', 'Vice President', 'Secrétaire Générale', 'Trésorier', 'Responsable Interne'],
      color: '#FF3B30',
      level: 0,
      centerRole: 'President' // President should be big at center
    },
    representantEtudiants: {
      title: 'Représentant Étudiants',
      roles: ['Représentant des étudiants étrangers', 'Représentant des Lauréats', 'Affaires Administratives'],
      color: '#007AFF',
      level: 1
    },
    techniqueMembers: {
      title: 'Équipe Technique',
      roles: ['IT Manager', 'IT Team'],
      color: '#5856D6',
      level: 2
    },
    operationCommunication: {
      title: 'Communication & Design',
      roles: ['Responsable Media', 'Responsables Création & Design'],
      color: '#FF9500',
      level: 3
    },
    relationExternes: {
      title: 'Relations Externes',
      roles: ['Responsables Sponsoring'],
      color: '#30D158',
      level: 4
    },
    conseillers: {
      title: 'Conseillers',
      roles: ['Conseillers'],
      color: '#34C759',
      level: 5
    }
  };

  const getHierarchyMembers = (roles) => {
    return members.filter(member => 
      roles.includes(member.role) && 
      (searchTerm === '' || member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       member.role.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // SVG Icons instead of emojis
  const getSVGIcon = (role) => {
    const iconMap = {
      'President': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
        </svg>
      ),
      'Vice President': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7V9C15 10.65 13.65 12 12 12S9 10.65 9 12V9H3V7H9C9 5.9 9.9 5 11 5H13C14.1 5 15 5.9 15 7H21V9ZM16 13V20C16 21.1 15.1 22 14 22H10C8.9 22 8 21.1 8 20V13H16Z"/>
        </svg>
      ),
      'Secrétaire Générale': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>
      ),
      'Trésorier': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M7,22A1,1 0 0,1 6,21A1,1 0 0,1 7,20H17A1,1 0 0,1 18,21A1,1 0 0,1 17,22H7M5.5,20A1,1 0 0,1 4.5,19A1,1 0 0,1 5.5,18H18.5A1,1 0 0,1 19.5,19A1,1 0 0,1 18.5,20H5.5Z"/>
        </svg>
      ),
      'Responsable Interne': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6Z"/>
        </svg>
      ),
      'IT Manager': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4,6H20V16H4M20,18A2,2 0 0,0 22,16V6C22,4.89 21.1,4 20,4H4C2.89,4 2,4.89 2,6V16A2,2 0 0,0 4,18H0V20H24V18H20Z"/>
        </svg>
      ),
      'IT Team': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17,12C17,14.42 15.28,16.44 13,16.9V21H11V16.9C8.72,16.44 7,14.42 7,12H9C9,13.65 10.35,15 12,15C13.65,15 15,13.65 15,12H17M12,2A3,3 0 0,1 15,5V6A3,3 0 0,1 12,9A3,3 0 0,1 9,6V5A3,3 0 0,1 12,2Z"/>
        </svg>
      ),
      'Responsable Media': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/>
        </svg>
      ),
      'Conseillers': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16,4C18.11,4 19.8,5.69 19.8,7.8C19.8,9.91 18.11,11.6 16,11.6C13.89,11.6 12.2,9.91 12.2,7.8C12.2,5.69 13.89,4 16,4M16,13.4C18.67,13.4 24,14.73 24,17.4V20H8V17.4C8,14.73 13.33,13.4 16,13.4M8.8,12C10.36,12 11.6,10.76 11.6,9.2C11.6,7.64 10.36,6.4 8.8,6.4C7.24,6.4 6,7.64 6,9.2C6,10.76 7.24,12 8.8,12M8.8,13.4C6.67,13.4 2.4,14.47 2.4,16.6V18.8H6.8V17.4C6.8,16.07 7.69,14.97 9.56,14.25C9,13.65 8.87,13.4 8.8,13.4Z"/>
        </svg>
      )
    };

    return iconMap[role] || (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
      </svg>
    );
  };

  const MemberCard = ({ member, department, isCenter = false, size = 'normal' }) => {
    const memberId = member.id || member._id;
    const isLarge = size === 'large' || isCenter;
    const isHovered = hoveredMember?.id === memberId;
    
    // Special sizing for Communication & Design section
    const isCommDesign = department.title === 'Communication & Design';
    
    // Determine card dimensions based on section and role
    let cardWidth, cardHeight, imageSize;
    
    if (isLarge) {
      // President and Vice President - make them bigger
      cardWidth = '350px';
      cardHeight = '420px';
      imageSize = '150px';
    } else if (isCommDesign) {
      // Communication & Design - smaller to fit 4 per row
      cardWidth = '220px';
      cardHeight = '300px';
      imageSize = '100px';
    } else {
      // All other sections - normal size
      cardWidth = '280px';
      cardHeight = '350px';
      imageSize = '120px';
    }
    
    return (
      <div
        onMouseEnter={() => setHoveredMember({ id: memberId, department: department.title })}
        onMouseLeave={() => setHoveredMember(null)}
        style={{
          background: 'var(--card-bg)',
          borderRadius: isLarge ? '24px' : '20px',
          padding: isLarge ? '32px' : '24px',
          textAlign: 'center',
          boxShadow: isHovered 
            ? `0 15px 40px ${department.color}30` 
            : '0 8px 25px rgba(0, 0, 0, 0.1)',
          border: `3px solid ${isHovered ? department.color : 'var(--card-border)'}`,
          position: 'relative',
          overflow: 'hidden',
          width: cardWidth,
          minHeight: cardHeight,
          transition: 'all 0.3s ease',
          margin: '0 auto',
          cursor: 'pointer',
          transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
          opacity: 1
        }}
      >
        {/* Simplified Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: isLarge ? '120px' : '80px',
          background: `linear-gradient(135deg, ${department.color}15, ${department.color}08)`,
          borderRadius: `${isLarge ? '24px' : '20px'} ${isLarge ? '24px' : '20px'} 0 0`,
          opacity: isHovered ? 1 : 0.7,
          transition: 'opacity 0.3s ease'
        }} />

        {/* Role Icon */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          color: department.color,
          background: 'var(--card-bg)',
          borderRadius: '50%',
          padding: '8px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          zIndex: 10,
          transition: 'transform 0.3s ease',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)'
        }}>
          {getSVGIcon(member.role)}
        </div>

        {/* Center Badge for President */}
        {isCenter && (
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: department.color,
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            zIndex: 10
          }}>
            Direction
          </div>
        )}

        {/* Profile Section */}
        <div style={{
          position: 'relative',
          marginBottom: '24px',
          zIndex: 5,
          marginTop: isLarge ? '40px' : '20px'
        }}>
          <div style={{
            width: imageSize,
            height: imageSize,
            borderRadius: '50%',
            overflow: 'hidden',
            margin: '0 auto',
            border: `4px solid ${department.color}`,
            boxShadow: isHovered 
              ? `0 12px 30px ${department.color}40` 
              : '0 8px 20px rgba(0, 0, 0, 0.15)',
            position: 'relative',
            transition: 'all 0.3s ease'
          }}>
            <img
              src={getImageUrl(member.photo) || '/images/default.jpg'}
              alt={member.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)'
              }}
              onError={(e) => {
                e.target.src = '/images/default.jpg';
              }}
            />
            
            {/* Status Indicator */}
            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#34C759',
              border: '3px solid var(--card-bg)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }} />
          </div>
        </div>

        {/* Member Information */}
        <div style={{ position: 'relative', zIndex: 5 }}>
          <p style={{
            margin: '0 0 8px 0',
            fontSize: isLarge ? '14px' : '12px',
            color: department.color,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {member.role}
          </p>

          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: isLarge ? '24px' : '20px',
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            lineHeight: '1.3'
          }}>
            {member.name}
          </h3>

          {/* Contact Information */}
          {member.phone && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-muted)',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
              </svg>
              <span style={{ fontSize: '12px' }}>{member.phone}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center'
          }}>
            <a
              href={`mailto:${member.email}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: department.color,
                color: 'white',
                padding: '8px 12px',
                borderRadius: '20px',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: '600',
                boxShadow: `0 4px 15px ${department.color}40`,
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/>
              </svg>
              Email
            </a>
            
            {member.phone && (
              <a
                href={`tel:${member.phone}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--secondary)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
                </svg>
                Appel
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };


  const HierarchyLevel = ({ department, members, isFirst = false }) => {
    if (!members || members.length === 0) return null;

    const isDirectionGenerale = department.title === 'Direction Générale';
    const presidentMember = isDirectionGenerale ? members.find(m => m.role === 'President') : null;

    return (
      <div style={{ marginBottom: '80px' }}>
        {/* Department Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '40px',
            background: 'var(--card-bg)',
            borderRadius: '20px',
            padding: '24px',
            border: `2px solid ${department.color}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            opacity: 0,
            transform: 'translateY(20px)',
            animation: 'fadeInUp 0.6s ease-out forwards'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${department.color}10, transparent)`,
            backgroundImage: `radial-gradient(circle at 20% 50%, ${department.color}15 0%, transparent 50%)`,
            backgroundSize: '100px 100px'
          }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '24px',
              fontWeight: 'bold',
              color: department.color
            }}>
              {department.title}
            </h3>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              fontSize: '14px',
              color: 'var(--text-muted)'
            }}>
              <span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}>
                  <path d="M16,4C18.11,4 19.8,5.69 19.8,7.8C19.8,9.91 18.11,11.6 16,11.6C13.89,11.6 12.2,9.91 12.2,7.8C12.2,5.69 13.89,4 16,4M16,13.4C18.67,13.4 24,14.73 24,17.4V20H8V17.4C8,14.73 13.33,13.4 16,13.4M8.8,12C10.36,12 11.6,10.76 11.6,9.2C11.6,7.64 10.36,6.4 8.8,6.4C7.24,6.4 6,7.64 6,9.2C6,10.76 7.24,12 8.8,12M8.8,13.4C6.67,13.4 2.4,14.47 2.4,16.6V18.8H6.8V17.4C6.8,16.07 7.69,14.97 9.56,14.25C9,13.65 8.87,13.4 8.8,13.4Z"/>
                </svg>
                {members.length} membre{members.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Members Layout */}
        {isDirectionGenerale ? (
          // Special layout for Direction Générale with President and VP side by side
          <div style={{ position: 'relative' }}>
            {/* President and Vice President side by side */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '40px',
              marginBottom: '40px',
              flexWrap: 'wrap'
            }}>
              {presidentMember && (
                <MemberCard 
                  member={presidentMember} 
                  department={department}
                  isCenter={true}
                  size="large"
                />
              )}
              {members.find(m => m.role === 'Vice President') && (
                <MemberCard 
                  member={members.find(m => m.role === 'Vice President')} 
                  department={department}
                  size="large"
                />
              )}
            </div>

            {/* Other Direction Générale members */}
            {members.filter(m => !['President', 'Vice President'].includes(m.role)).length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
                gap: '32px',
                justifyItems: 'center',
                maxWidth: '1200px',
                margin: '0 auto'
              }}>
                {members.filter(m => !['President', 'Vice President'].includes(m.role)).map((member, index) => (
                  <MemberCard 
                    key={member.id || member._id || index} 
                    member={member} 
                    department={department}
                    size="medium"
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Regular grid layout for other departments
          <div style={{
            display: 'grid',
            gridTemplateColumns: department.title === 'Communication & Design' 
              ? `repeat(auto-fit, minmax(220px, 1fr))` 
              : `repeat(auto-fit, minmax(280px, 1fr))`,
            gap: department.title === 'Communication & Design' ? '20px' : '32px',
            justifyItems: 'center',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            {members.map((member, index) => (
              <MemberCard 
                key={member.id || member._id || index} 
                member={member} 
                department={department}
              />
            ))}
          </div>
        )}

        {/* Connection Line to Next Level - REMOVED */}

        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className={`members-org-chart-custom ${className}`} style={{
      maxWidth: '1600px',
      margin: '0 auto',
      padding: '40px 20px'
    }}>
      {/* Search Controls */}
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '40px',
        border: '1px solid var(--card-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ flex: '1', maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Rechercher un membre ou rôle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid var(--card-border)',
                background: 'var(--bg-secondary)',
                fontSize: '14px',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
            />
          </div>
        </div>
      </div>

      {/* Custom Hierarchy Display */}
      <div
        style={{
          opacity: 0,
          animation: 'fadeIn 0.6s ease-out forwards'
        }}
      >
        {/* Direction Générale */}
        <HierarchyLevel 
          department={hierarchy.directionGenerale}
          members={getHierarchyMembers(hierarchy.directionGenerale.roles)}
          isFirst={true}
        />

        {/* Représentant Étudiants */}
        <HierarchyLevel 
          department={hierarchy.representantEtudiants}
          members={getHierarchyMembers(hierarchy.representantEtudiants.roles)}
        />

        {/* Équipe Technique - seulement si il y a des membres */}
        {getHierarchyMembers(hierarchy.techniqueMembers.roles).length > 0 && (
          <HierarchyLevel 
            department={hierarchy.techniqueMembers}
            members={getHierarchyMembers(hierarchy.techniqueMembers.roles)}
          />
        )}

        {/* Communication & Design */}
        <HierarchyLevel 
          department={hierarchy.operationCommunication}
          members={getHierarchyMembers(hierarchy.operationCommunication.roles)}
        />

        {/* Relations Externes */}
        <HierarchyLevel 
          department={hierarchy.relationExternes}
          members={getHierarchyMembers(hierarchy.relationExternes.roles)}
        />

        {/* Conseillers */}
        <HierarchyLevel 
          department={hierarchy.conseillers}
          members={getHierarchyMembers(hierarchy.conseillers.roles)}
        />
      </div>

      {/* Hover Details */}
      {hoveredMember && (
        <div
          style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--card-bg)',
            padding: '20px 28px',
            borderRadius: '16px',
            boxShadow: '0 15px 50px rgba(0, 0, 0, 0.3)',
            border: '2px solid var(--primary)',
            zIndex: 1000,
            maxWidth: '400px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            opacity: 0,
            animation: 'fadeInScale 0.3s ease-out forwards'
          }}
        >
          <p style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'var(--text-primary)'
          }}>
            {members.find(m => (m.id || m._id) === hoveredMember.id)?.name}
          </p>
          <p style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            color: 'var(--primary)',
            fontWeight: '600'
          }}>
            {members.find(m => (m.id || m._id) === hoveredMember.id)?.role}
          </p>
          <p style={{
            margin: '0',
            fontSize: '12px',
            color: 'var(--text-muted)'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}>
              <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"/>
            </svg>
            {hoveredMember.department}
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: translateX(-50%) scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) scale(1) translateY(0);
          }
        }
      `}</style>

      {/* Statistics Panel */}
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '20px',
        padding: '24px',
        marginTop: '40px',
        border: '1px solid var(--card-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <h4 style={{
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: 'bold',
          color: 'var(--text-primary)',
          textAlign: 'center'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
            <path d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z"/>
          </svg>
          Statistiques Organisationnelles
        </h4>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          {Object.entries(hierarchy).map(([key, dept]) => {
            const deptMembers = getHierarchyMembers(dept.roles);
            return (
              <div
                key={key}
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  border: `2px solid ${dept.color}20`
                }}
              >
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: dept.color,
                  marginBottom: '4px'
                }}>
                  {deptMembers.length}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  fontWeight: '600'
                }}>
                  {dept.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MembersOrgChart;