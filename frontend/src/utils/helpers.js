// Helper functions for the ADEI website

export const getCategoryLabel = (category) => {
  const categoryLabels = {
    'academic': 'Académique',
    'sportif': 'Sportif',
    'show': 'Show',
    'party': 'Party',
    'formation': 'Formation',
    'conference': 'Conférence',
    'autre': 'Autre'
  };
  return categoryLabels[category] || category;
};

export const getOrganizerName = (item) => {
  if (item.club?.club) {
    return item.club.club;
  }
  if (item.organizer) {
    return item.organizer;
  }
  if (item.clubId === 'adei') {
    return 'ADEI';
  }
  if (item.clubId === 'ensa') {
    return 'Administration ENSA Fès';
  }
  return 'ADEI';
};

export const getOrganizerLink = (item) => {
  if (item.club?.club) {
    return `/clubs`;
  }
  if (item.organizer === 'Administration ENSA Fès' || item.clubId === 'ensa') {
    return '/ensa';
  }
  return '/adei';
};

export const handleOrganizerClick = (item) => {
  const link = getOrganizerLink(item);
  window.location.hash = `#${link}`;
};

export const CATEGORY_OPTIONS = [
  { value: '', label: 'Sélectionner une catégorie' },
  { value: 'academic', label: 'Académique' },
  { value: 'sportif', label: 'Sportif' },
  { value: 'show', label: 'Show' },
  { value: 'party', label: 'Party' },
  { value: 'formation', label: 'Formation' },
  { value: 'conference', label: 'Conférence' },
  { value: 'autre', label: 'Autre' }
];