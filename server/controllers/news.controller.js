const newsService = require('../services/news.service');

exports.getAll = async (req, res) => {
  const { data, cached } = await newsService.listNews();
  if (cached) return res.json({ success: true, data, cached: true });
  res.json({ success: true, data, count: data.length });
};

exports.create = async (req, res) => {
  try {
    const news = await newsService.createNews(req.body, req.files);
    res.status(201).json({ success: true, message: 'Actualité créée avec succès!', news });
  } catch (error) {
    res.status(500).json({ success: false, message: `Erreur lors de la création de l'actualité: ${error.message}` });
  }
};

exports.update = async (req, res) => {
  try {
    const news = await newsService.updateNews(req.params.id, req.body, req.files);
    if (!news) return res.status(404).json({ message: 'Actualité non trouvée' });
    res.json({ success: true, message: 'Actualité modifiée avec succès!', news });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'actualité" });
  }
};

exports.remove = async (req, res) => {
  try {
    const ok = await newsService.deleteNews(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Actualité non trouvée' });
    res.json({ success: true, message: 'Actualité supprimée' });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de l'actualité" });
  }
};

exports.reorder = async (req, res) => {
  try {
    const result = await newsService.reorderNews(req.params.id, req.body.direction);
    if (result.notFound) return res.status(404).json({ message: 'Actualité non trouvée' });
    if (result.unchanged) return res.json({ success: true, message: 'Aucun changement nécessaire' });
    res.json({ success: true, message: 'Ordre modifié avec succès' });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la modification de l'ordre" });
  }
};