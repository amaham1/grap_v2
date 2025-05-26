import { defineEventHandler, getRouterParam } from 'h3';
import { getExhibitionById } from '~/server/dao/supabase/exhibition-dao';

export default defineEventHandler(async (event) => {
  try {
    const exhibitionId = getRouterParam(event, 'id');
    if (!exhibitionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request: Exhibition ID is required.',
      });
    }

    const id = parseInt(exhibitionId, 10);
    if (isNaN(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request: Exhibition ID must be a number.',
      });
    }

    const exhibition = await getExhibitionById(id);

    if (!exhibition) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Exhibition not found.',
      });
    }

    return {
      statusCode: 200,
      statusMessage: 'Success',
      data: exhibition,
    };

  } catch (error: any) {
    console.error(`Error fetching exhibition with id ${getRouterParam(event, 'id')}:`, error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error: Could not fetch exhibition.',
      data: error.message,
    });
  }
});
