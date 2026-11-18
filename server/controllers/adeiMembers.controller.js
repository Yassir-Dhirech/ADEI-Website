const membersService = require('../services/adeiMembers.service');

exports.getAll = async (req, res) => {
  try {
    res.json(await membersService.listMembers());
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des membres ADEI' });
  }
};

exports.create = async (req, res) => {
  try {
    res.status(201).json(await membersService.createMember(req.body, req.file));
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du membre ADEI' });
  }
};

exports.update = async (req, res) => {
  try {
    const member = await membersService.updateMember(req.params.id, req.body, req.file);
    if (!member) return res.status(404).json({ message: 'Membre ADEI non trouvé' });
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du membre ADEI' });
  }
};

exports.remove = async (req, res) => {
  try {
    const ok = await membersService.deleteMember(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Membre ADEI non trouvé' });
    res.json({ success: true, message: 'Membre ADEI supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du membre ADEI' });
  }
};