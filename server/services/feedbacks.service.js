const jwt = require('jsonwebtoken');
const { Feedback, User, FeedbackLike } = require('../models');
const { pickFields } = require('../utils/sanitize');
const { JWT_SECRET } = require('../middleware/auth');

async function listPublicFeedbacks() {
  try {
    const data = await Feedback.findAll({
      where: { isPublished: true },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'type', 'message', 'createdAt', 'userId'],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'is_president', 'is_representant', 'is_membre_adei', 'is_bureau_adei'],
        required: false
      }]
    });
    return { data, fallback: false };
  } catch {
    const data = await Feedback.findAll({
      where: { isPublished: true },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'type', 'message', 'createdAt']
    });
    return { data, fallback: true };
  }
}

async function listAllFeedbacks() {
  return Feedback.findAll({
    order: [['createdAt', 'DESC']],
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'username', 'email', 'is_president', 'is_representant', 'is_membre_adei', 'is_bureau_adei'],
      required: false
    }]
  });
}

async function createFeedback(body, token) {
  const data = pickFields(body, 'feedbacks');
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      data.userId = decoded.id || decoded.userId;
    } catch {
      // Token invalide : feedback anonyme autorisé
    }
  }
  return Feedback.create(data);
}

async function markAsRead(id) {
  const [updated] = await Feedback.update({ read: true }, { where: { id } });
  return updated ? Feedback.findByPk(id) : null;
}

async function setPublished(id, isPublished) {
  const feedback = await Feedback.findByPk(id);
  if (!feedback) return null;
  const nextStatus = typeof isPublished === 'boolean' ? isPublished : !feedback.isPublished;
  await feedback.update({ isPublished: nextStatus });
  return feedback;
}

async function deleteFeedback(id) {
  return (await Feedback.destroy({ where: { id } })) > 0;
}

async function toggleLike(feedbackId, userId) {
  const existing = await FeedbackLike.findOne({ where: { feedbackId, userId } });
  if (existing) {
    await existing.destroy();
  } else {
    await FeedbackLike.create({ feedbackId, userId });
  }
  const likesCount = await FeedbackLike.count({ where: { feedbackId } });
  return { liked: !existing, likesCount };
}

module.exports = { listPublicFeedbacks, listAllFeedbacks, createFeedback, markAsRead, setPublished, deleteFeedback , toggleLike };