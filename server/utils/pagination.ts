export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function parsePagination(query: Record<string, unknown> = {}): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page ?? ''), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? ''), 10) || 50));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}
