import { executeQuery } from '../mysql';

export interface WelfareService {
  id: number;
  original_api_id?: string | null;
  service_name: string;
  category_name?: string | null;
  support_target_html?: string | null;
  service_content?: string | null;
  application_method?: string | null;
  application_period?: string | null;
  contact_info?: string | null;
  website_url?: string | null;
  provider_agency?: string | null;
  is_exposed: boolean;
  admin_memo?: string | null;
  api_raw_data?: string | null; // JSON string
  fetched_at?: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface GetWelfareServicesOptions {
  page?: number;
  limit?: number;
  searchTerm?: string;
  isExposed?: string; // 'true', 'false', or ''
  categoryName?: string;
}

export interface WelfareServicesResponse {
  data: WelfareService[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const TABLE_NAME = 'welfare_services';

export async function getWelfareServices(options: GetWelfareServicesOptions): Promise<WelfareServicesResponse> {
  const { page = 1, limit = 10, searchTerm, isExposed, categoryName } = options;
  const offset = (page - 1) * limit;

  let query = `SELECT * FROM ${TABLE_NAME}`;
  let countQuery = `SELECT COUNT(*) as total FROM ${TABLE_NAME}`;
  const params: any[] = [];
  const countParams: any[] = [];
  const conditions: string[] = [];

  if (searchTerm) {
    conditions.push(`service_name LIKE ?`);
    params.push(`%${searchTerm}%`);
    countParams.push(`%${searchTerm}%`);
  }

  if (isExposed === 'true' || isExposed === 'false') {
    conditions.push(`is_exposed = ?`);
    params.push(isExposed === 'true');
    countParams.push(isExposed === 'true');
  }

  if (categoryName) {
    conditions.push(`category_name LIKE ?`);
    params.push(`%${categoryName}%`);
    countParams.push(`%${categoryName}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
    countQuery += ' WHERE ' + conditions.join(' AND ');
  }

  query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [data, totalResult] = await Promise.all([
    executeQuery<WelfareService[]>(query, params),
    executeQuery<{ total: number }[]>(countQuery, countParams)
  ]);

  const total = totalResult[0].total;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

export async function getWelfareServiceById(id: number): Promise<WelfareService | null> {
  const query = `SELECT * FROM ${TABLE_NAME} WHERE id = ?`;
  const results = await executeQuery<WelfareService[]>(query, [id]);
  return results.length > 0 ? results[0] : null;
}

export async function createWelfareService(data: Partial<WelfareService>): Promise<{ id: number }> {
  // Ensure is_exposed has a default if not provided
  const welfareServiceData = {
    is_exposed: true,
    ...data,
    fetched_at: data.fetched_at || new Date(),
  };
  const query = `INSERT INTO ${TABLE_NAME} SET ?`;
  // @ts-ignore
  const result = await executeQuery<{ insertId: number }>(query, [welfareServiceData]);
  return { id: result.insertId };
}

export async function updateWelfareService(id: number, data: Partial<WelfareService>): Promise<boolean> {
  const fieldsToUpdate: Partial<WelfareService & { updated_at: Date }> = { ...data, updated_at: new Date() };

  // Handle boolean to integer conversion for is_exposed
  if (typeof fieldsToUpdate.is_exposed === 'boolean') {
    // @ts-ignore
    fieldsToUpdate.is_exposed = fieldsToUpdate.is_exposed ? 1 : 0;
  }

  const fieldEntries = Object.entries(fieldsToUpdate)
    .filter(([_, value]) => value !== undefined);

  if (fieldEntries.length === 0) {
    return true; // No fields to update, consider it a success
  }

  const setClauses = fieldEntries.map(([key]) => `${key} = ?`).join(', ');
  const values = fieldEntries.map(([, value]) => value);
  values.push(id); // Add id for the WHERE clause

  const query = `UPDATE ${TABLE_NAME} SET ${setClauses} WHERE id = ?`;

  const result = await executeQuery<{ affectedRows: number }>(query, values);
  return result.affectedRows > 0;
}

export async function deleteWelfareService(id: number): Promise<boolean> {
  const query = `DELETE FROM ${TABLE_NAME} WHERE id = ?`;
    // @ts-ignore
  const result = await executeQuery<{ affectedRows: number }>(query, [id]);
  return result.affectedRows > 0;
}
