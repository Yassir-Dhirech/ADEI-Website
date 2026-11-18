const eventsService = require('../services/events.service');

exports.getAll = async (req, res) => {
  const { data, cached } = await eventsService.listEvents();
  if (cached) return res.json({ success: true, data, cached: true });
  res.json({ success: true, data, count: data.length });
};

exports.create = async (req, res) => {
  try {
    const event = await eventsService.createEvent(req.body, req.files);
    res.status(201).json({ success: true, message: 'Événement créé avec succès!', event });
  } catch (error) {
    res.status(500).json({ success: false, message: `Erreur lors de la création de l'événement: ${error.message}` });
  }
};

exports.update = async (req, res) => {
  try {
    const event = await eventsService.updateEvent(req.params.id, req.body, req.files);
    if (!event) return res.status(404).json({ message: 'Événement non trouvé' });
    res.json({ success: true, message: 'Événement modifié avec succès!', event });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'événement" });
  }
};

exports.remove = async (req, res) => {
  try {
    const ok = await eventsService.deleteEvent(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Événement non trouvé' });
    res.json({ success: true, message: 'Événement supprimé' });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de l'événement" });
  }
};

exports.reorder = async (req, res) => {
  try {
    const result = await eventsService.reorderEvent(req.params.id, req.body.direction);
    if (result.notFound) return res.status(404).json({ message: 'Événement non trouvé' });
    if (result.unchanged) return res.json({ success: true, message: 'Aucun changement nécessaire' });
    res.json({ success: true, message: 'Ordre modifié avec succès' });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la modification de l'ordre" });
  }
};