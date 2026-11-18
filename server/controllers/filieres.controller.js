const filieresService = require('../services/filieres.service');

exports.getAll = async (req, res) => {
  const data = await filieresService.listFilieres();
  res.json({ success: true, data, count: data.length });
};

exports.create = async (req, res) => {
  try {
    const filiere = await filieresService.createFiliere(req.body);
    res.status(201).json({ success: true, message: 'Filière créée avec succès!', filiere });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la création de la filière - Veuillez réessayer' });
  }
};

exports.update = async (req, res) => {
  try {
    const filiere = await filieresService.updateFiliere(req.params.id, req.body);
    if (!filiere) return res.status(404).json({ success: false, message: 'Filière non trouvée - Impossible de modifier cette filière' });
    res.json({ success: true, message: 'Filière modifiée avec succès!', filiere });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'Cette abréviation existe déjà. Veuillez choisir une autre abréviation.' });
    }
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ success: false, message: `Erreur de validation: ${error.errors.map((e) => e.message).join(', ')}` });
    }
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la filière - Veuillez réessayer' });
  }
};

exports.remove = async (req, res) => {
  try {
    const ok = await filieresService.deleteFiliere(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Filière non trouvée' });
    res.json({ success: true, message: 'Filière supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de la filière' });
  }
};