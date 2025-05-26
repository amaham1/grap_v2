import { defineEventHandler, getRouterParam, readBody } from 'h3';
import { updateExhibition, getExhibitionById, Exhibition } from '~/server/dao/supabase/exhibition-dao';

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

    const body = await readBody<Partial<Omit<Exhibition, 'id' | 'created_at' | 'updated_at'>>>(event);

    if (Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request: No data provided for update.',
      });
    }

    // Ensure fetched_at is updated if other fields are, or handled by DAO
    // For explicit update, ensure it's part of the body if it needs to change.
    // The DAO's updateExhibition handles is_exposed boolean conversion.

    const result = await updateExhibition(id, body);

    if (result && result.data) {
      const updatedExhibition = await getExhibitionById(id);
      return {
        statusCode: 200,
        statusMessage: 'Exhibition updated successfully',
        data: updatedExhibition,
      };
    } else {
      // Could be that the exhibition was not found, or no rows were changed.
      const existingExhibition = await getExhibitionById(id);
      if (!existingExhibition) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Exhibition not found.',
        });
      }
      // If it exists but no rows affected, likely data was same or an issue occurred
      return { // Or throw an error if update was expected to change something
        statusCode: 200, // Or 304 Not Modified, but 200 with data is also common
        statusMessage: 'Exhibition not modified (data may be the same or update failed silently)',
        data: existingExhibition, // Return current state
      };
    }

  } catch (error: any) {
    console.error(`Error updating exhibition with id ${getRouterParam(event, 'id')}:`, error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error: Could not update exhibition.',
      data: error.message,
    });
  }
});
