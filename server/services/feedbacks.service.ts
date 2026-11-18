import jwt from 'jsonwebtoken';
import { Feedback, User, FeedbackLike } from '../models';
import { pickFields } from '../utils/sanitize';
import { JWT_SECRET } from '../middleware/auth';
import { parsePagination, buildPaginationMeta, PaginationMeta } from '../utils/pagination';
import { AuthUserPayload } from '../types/express';

export async function listPublicFeedbacks(query: Record<string, unknown> = {}): Promise<{ data: Feedback[]; meta: PaginationMeta; fallback: boolean }> {
  const { page, limit, offset } = parsePagination(query);
  try {
    const { rows, count } = await Feedback.findAndCountAll({
      where: { isPublished: true },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'type', 'message', 'createdAt', 'userId'],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'is_president', 'is_representant', 'is_membre_adei', 'is_bureau_adei'],
        required: false
      }],
      limit,
      offset
    });
    return { data: rows, meta: buildPaginationMeta(count, page, limit), fallback: false };
  } catch {
    const { rows, count } = await Feedback.findAndCountAll({
      where: { isPublished: true },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'type', 'message', 'createdAt'],
      limit,
      offset
    });
    return { data: rows, meta: buildPaginationMeta(count, page, limit), fallback: true };
  }
}

export async function listAllFeedbacks(query: Record<string, unknown> = {}): Promise<{ data: Feedback[]; meta: PaginationMeta }> {
  const { page, limit, offset } = parsePagination(query);
  const { rows, count } = await Feedback.findAndCountAll({
    order: [['createdAt', 'DESC']],
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'username', 'email', 'is_president', 'is_representant', 'is_membre_adei', 'is_bureau_adei'],
      required: false
    }],
    limit,
    offset
  });
  return { data: rows, meta: buildPaginationMeta(count, page, limit) };
}

export async function createFeedback(body: Record<string, unknown>, token?: string | null): Promise<Feedback> {
  const data = pickFields(body, 'feedbacks');
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
      data.userId = decoded.id || decoded.userId;
    } catch {
      // Token invalide : feedback anonyme autorisé
    }
  }
  return Feedback.create(data);
}

export async function markAsRead(id: string | number): Promise<Feedback | null> {
  const [updated] = await Feedback.update({ read: true }, { where: { id } });
  return updated ? Feedback.findByPk(id) : null;
}

export async function setPublished(id: string | number, isPublished?: unknown): Promise<Feedback | null> {
  const feedback = await Feedback.findByPk(id);
  if (!feedback) return null;
  const nextStatus = typeof isPublished === 'boolean' ? isPublished : !feedback.isPublished;
  await feedback.update({ isPublished: nextStatus });
  return feedback;
}

export async function deleteFeedback(id: string | number): Promise<boolean> {
  return (await Feedback.destroy({ where: { id } })) > 0;
}

export async function toggleLike(feedbackId: string | number, userId: number): Promise<{ liked: boolean; likesCount: number }> {
  const numericFeedbackId = Number(feedbackId);
  const existing = await FeedbackLike.findOne({ where: { feedbackId: numericFeedbackId, userId } });
  if (existing) {
    await existing.destroy();
  } else {
    await FeedbackLike.create({ feedbackId: numericFeedbackId, userId });
  }
  const likesCount = await FeedbackLike.count({ where: { feedbackId: numericFeedbackId } });
  return { liked: !existing, likesCount };
}
