import { defineEventHandler, getRouterParam } from 'h3';
import { deleteExhibition, getExhibitionById } from '~/server/dao/supabase/exhibition-dao';

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

    // Optional: Check if exhibition exists before attempting delete
    const existingExhibition = await getExhibitionById(id);
    if (!existingExhibition) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Exhibition not found.',
      });
    }

    const result = await deleteExhibition(id);

    if (result && result.data) {
      return {
        statusCode: 200, // Or 204 No Content, but 200 with a message is also fine
        statusMessage: 'Exhibition deleted successfully',
        data: { id }, // Optionally return the id of the deleted item
      };
    } else {
      // This case should ideally be caught by the 404 above if the item didn't exist
      // If it existed but affectedRows is 0, it's an unexpected situation.
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete exhibition or exhibition was already deleted.',
      });
    }

  } catch (error: any) {
    console.error(`Error deleting exhibition with id ${getRouterParam(event, 'id')}:`, error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error: Could not delete exhibition.',
      data: error.message,
    });
  }
});
