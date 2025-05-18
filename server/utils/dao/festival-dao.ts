import { executeQuery } from '../mysql'; // MySQL 유틸리티 경로 (nuxt.config.ts 별칭 사용)
import type { Festival } from '~/server/types/entities';

interface GetFestivalsParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
  filterStatus?: 'true' | 'false' | ''; // 'true', 'false', 또는 전체
  // sortBy?: string; (추후 확장)
  // sortOrder?: 'asc' | 'desc'; (추후 확장)
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

export const festivalDAO = {
  async getFestivals(params: GetFestivalsParams): Promise<{ data: Festival[], total: number }> {
    const { 
      page = DEFAULT_PAGE, 
      limit = DEFAULT_LIMIT, 
      searchQuery, 
      filterStatus 
    } = params;

    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM festivals';
    let countQuery = 'SELECT COUNT(*) as total FROM festivals';
    const whereClauses: string[] = [];
    const queryParams: (string | number | boolean)[] = [];

    if (searchQuery) {
      whereClauses.push('title LIKE ?');
      queryParams.push(`%${searchQuery}%`);
    }

    if (filterStatus === 'true' || filterStatus === 'false') {
      whereClauses.push('is_show = ?');
      queryParams.push(filterStatus === 'true'); // boolean으로 변환
    }

    if (whereClauses.length > 0) {
      const whereString = ' WHERE ' + whereClauses.join(' AND ');
      query += whereString;
      countQuery += whereString;
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const pagedQueryParams = [...queryParams, limit, offset];

    try {
      // @ts-ignore TODO: mysql 유틸리티 타입 정의 필요
      const [festivalsResult, countResult] = await Promise.all([
        executeQuery(query, pagedQueryParams) as Promise<Festival[]>,
        executeQuery(countQuery, queryParams) as Promise<{ total: number }[]>,
      ]);
      
      const festivals = festivalsResult || [];
      const total = countResult[0]?.total || 0;
      
      return { data: festivals, total };
    } catch (error) {
      console.error('Error fetching festivals:', error);
      throw new Error('Failed to fetch festivals');
    }
  },

  async toggleFestivalVisibility(id: string, currentIsShow: boolean): Promise<boolean> {
    const newIsShow = !currentIsShow;
    const query = 'UPDATE festivals SET is_show = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    try {
      // @ts-ignore TODO: mysql 유틸리티 타입 정의 필요
      const result = await executeQuery(query, [newIsShow, id]) as { affectedRows?: number };
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error toggling visibility for festival ${id}:`, error);
      throw new Error('Failed to toggle festival visibility');
    }
  },

  async getFestivalById(id: string): Promise<Festival | null> {
    const query = 'SELECT * FROM festivals WHERE id = ?';
    try {
      // @ts-ignore TODO: mysql 유틸리티 타입 정의 필요
      const result = await executeQuery(query, [id]) as Festival[];
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Error fetching festival by id ${id}:`, error);
      throw new Error('Failed to fetch festival by id');
    }
  },

  async updateFestival(id: number, data: Partial<Festival>): Promise<boolean> {
    const fieldsToUpdate: Partial<Festival & { updated_at: Date }> = { ...data, updated_at: new Date() };

    // Handle boolean to integer conversion for is_show
    if (typeof fieldsToUpdate.is_show === 'boolean') {
      // @ts-ignore
      fieldsToUpdate.is_show = fieldsToUpdate.is_show ? 1 : 0;
    }

    const fieldEntries = Object.entries(fieldsToUpdate)
      .filter(([_, value]) => value !== undefined);

    if (fieldEntries.length === 0) {
      return true; // No fields to update, consider it a success
    }

    const setClauses = fieldEntries.map(([key]) => `${key} = ?`).join(', ');
    const values = fieldEntries.map(([, value]) => value);
    values.push(id); // Add id for the WHERE clause

    const query = `UPDATE festivals SET ${setClauses} WHERE id = ?`;

    const result = await executeQuery<{ affectedRows: number }>(query, values);
    return result.affectedRows > 0;
  }
};
