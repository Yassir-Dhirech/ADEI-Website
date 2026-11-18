const partnersService = require('../services/partners.service');

exports.getAll = async (req, res) => {
  try {
    res.json(await partnersService.listPartners());
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des partenaires' });
  }
};

exports.create = async (req, res) => {
  try {
    const partner = await partnersService.createPartner(req.body, req.file);
    res.status(201).json({ success: true, message: 'Partenaire créé avec succès!', partner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la création du partenaire - Veuillez réessayer' });
  }
};

exports.update = async (req, res) => {
  try {
    const partner = await partnersService.updatePartner(req.params.id, req.body, req.file);
    if (!partner) return res.status(404).json({ success: false, message: 'Partenaire non trouvé - Impossible de modifier ce partenaire' });
    res.json({ success: true, message: 'Partenaire modifié avec succès!', partner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du partenaire - Veuillez réessayer' });
  }
};

exports.remove = async (req, res) => {
  try {
    const ok = await partnersService.deletePartner(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Partenaire non trouvé' });
    res.json({ success: true, message: 'Partenaire supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du partenaire' });
  }
};

exports.reorder = async (req, res) => {
  try {
    const result = await partnersService.reorderPartner(req.params.id, req.body.direction);
    if (result.notFound) return res.status(404).json({ message: 'Partenaire non trouvé' });
    if (result.unchanged) return res.json({ success: true, message: 'Aucun changement nécessaire' });
    res.json({ success: true, message: 'Ordre modifié avec succès' });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la modification de l'ordre" });
  }
};