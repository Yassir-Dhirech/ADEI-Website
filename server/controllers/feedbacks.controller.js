const feedbacksService = require('../services/feedbacks.service');

exports.getPublic = async (req, res) => {
  const { data, fallback } = await feedbacksService.listPublicFeedbacks();
  const response = { success: true, data, count: data.length };
  if (fallback) response.note = 'Données utilisateur non disponibles';
  res.json(response);
};

exports.getAll = async (req, res) => {
  try {
    res.json(await feedbacksService.listAllFeedbacks());
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des feedbacks' });
  }
};

exports.create = async (req, res) => {
  try {
    const cookieToken = req.cookies?.adei_token;
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    await feedbacksService.createFeedback(req.body, cookieToken || headerToken);
    res.status(201).json({ success: true, message: 'Votre feedback a été envoyé avec succès!' });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur lors de l'envoi du feedback" });
  }
};

exports.markRead = async (req, res) => {
  try {
    const feedback = await feedbacksService.markAsRead(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback non trouvé' });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du feedback' });
  }
};

exports.publish = async (req, res) => {
  try {
    const feedback = await feedbacksService.setPublished(req.params.id, req.body?.isPublished);
    if (!feedback) return res.status(404).json({ message: 'Feedback non trouvé' });
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la modération du feedback' });
  }
};

exports.remove = async (req, res) => {
  try {
    const ok = await feedbacksService.deleteFeedback(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Feedback non trouvé' });
    res.json({ success: true, message: 'Feedback supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du feedback' });
  }
};