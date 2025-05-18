import { defineEventHandler, getQuery } from 'h3';
import { getExhibitions, getExhibitionsCount, GetExhibitionsParams } from '~/server/utils/dao/exhibition-dao';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event) as GetExhibitionsParams;

    // Convert query params to appropriate types
    const page = query.page ? parseInt(String(query.page), 10) : 1;
    const limit = query.limit ? parseInt(String(query.limit), 10) : 10;
    const params: GetExhibitionsParams = {
      ...query,
      page,
      limit,
      isExposed: query.isExposed !== undefined ? String(query.isExposed) : undefined,
    };

    const exhibitions = await getExhibitions(params);
    const total = await getExhibitionsCount(params);

    return {
      statusCode: 200,
      statusMessage: 'Success',
      data: exhibitions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error('Error fetching exhibitions:', error);
    // Nuxt 3 way to return errors
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching exhibitions',
      data: error.message,
    });
  }
});
