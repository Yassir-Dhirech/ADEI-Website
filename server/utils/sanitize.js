const ALLOWED_FIELDS = {
  news: ['title', 'content', 'date', 'clubId', 'organizer', 'image', 'document', 'link', 'category', 'order_display'],
  events: ['title', 'description', 'date', 'time', 'location', 'category', 'clubId', 'organizer', 'image', 'document', 'link'],
  clubs: ['club', 'president', 'annees_etude', 'tel', 'email', 'website', 'image', 'description', 'activities', 'achievements', 'members', 'facebook', 'instagram', 'linkedin'],
  feedbacks: ['name', 'email', 'type', 'message'],
  'adei-members': ['name', 'role', 'email', 'photo'],
  partners: ['name', 'description', 'website', 'logo', 'facebook', 'instagram', 'whatsapp', 'isActive', 'order_display'],
  filieres: ['name', 'abbreviation', 'type', 'documentation', 'drive', 'description', 'isActive', 'order_display', 'responsable_pedagogique', 'responsable_contact', 'delegue_cp1_a', 'tel_delegue_cp1_a', 'delegue_cp1_b', 'tel_delegue_cp1_b', 'delegue_cp1_c', 'tel_delegue_cp1_c', 'delegue_cp2_a', 'tel_delegue_cp2_a', 'delegue_cp2_b', 'tel_delegue_cp2_b', 'delegue_cp2_c', 'tel_delegue_cp2_c', 'delegue_annee1', 'tel_delegue_annee1', 'delegue_annee2', 'tel_delegue_annee2', 'delegue_annee3', 'tel_delegue_annee3'],
  users: ['username', 'email', 'password', 'role', 'is_president', 'is_representant', 'is_membre_adei', 'is_bureau_adei']
};

const pickFields = (body, type) => {
  const allowed = ALLOWED_FIELDS[type] || [];
  const result = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      result[key] = body[key];
    }
  }
  return result;
};

module.exports = { ALLOWED_FIELDS, pickFields };