const clubsService = require('../services/clubs.service');

exports.getAll = async (req, res) => {
  const data = await clubsService.listClubs();
  res.json({ success: true, data, count: data.length, source: 'database' });
};

exports.create = async (req, res) => {
  try {
    const club = await clubsService.createClub(req.body, req.file);
    res.status(201).json({ success: true, message: 'Club créé avec succès!', club });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la création du club - Veuillez réessayer' });
  }
};

exports.update = async (req, res) => {
  try {
    const club = await clubsService.updateClub(req.params.id, req.body, req.file);
    if (!club) return res.status(404).json({ success: false, message: 'Club non trouvé - Impossible de modifier ce club' });
    res.json({ success: true, message: 'Club modifié avec succès!', club });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du club - Veuillez réessayer' });
  }
};

exports.remove = async (req, res) => {
  try {
    const ok = await clubsService.deleteClub(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Club non trouvé' });
    res.json({ success: true, message: 'Club supprimé avec succès!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression du club' });
  }
};