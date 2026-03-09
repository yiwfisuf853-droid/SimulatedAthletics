/**
 * API响应包装
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 排行榜条目
 */
export interface LeaderboardEntry {
  id: string;
  rank: number;
  playerName: string;
  score: number;
  size: number;
  duration: number;
  lazy: boolean;
  createdAt: string;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * 排行榜查询参数
 */
export interface LeaderboardQuery extends PaginationParams {
  size?: number;
  lazy?: boolean;
  period?: 'all' | 'day' | 'week' | 'month';
}
