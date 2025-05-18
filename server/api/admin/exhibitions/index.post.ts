import { defineEventHandler, readBody } from 'h3';
import { createExhibition, Exhibition } from '~/server/utils/dao/exhibition-dao';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<Omit<Exhibition, 'id' | 'created_at' | 'updated_at'>>(event);

    // Validate required fields as per DAO or DB schema
    if (!body.title || !body.api_raw_data || !body.fetched_at) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request: title, api_raw_data, and fetched_at are required fields.',
      });
    }

    // Ensure 'is_exposed' is explicitly set if not provided, defaulting to false as per DDL
    const exhibitionData: Omit<Exhibition, 'id' | 'created_at' | 'updated_at'> = {
      ...body,
      is_exposed: body.is_exposed === undefined ? false : body.is_exposed,
      // fetched_at should be provided in the body, typically as new Date().toISOString()
    };

    const result = await createExhibition(exhibitionData);

    if (result && result.insertId) {
      const newExhibition = await getExhibitionById(result.insertId); // Assuming getExhibitionById exists
      return {
        statusCode: 201,
        statusMessage: 'Exhibition created successfully',
        data: newExhibition,
      };
    } else {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create exhibition: No insertId returned',
      });
    }

  } catch (error: any) {
    console.error('Error creating exhibition:', error);
    // Check if it's a known error type (like from createError)
    if (error.statusCode) {
      throw error; // Re-throw if it's already a handled H3Error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error: Could not create exhibition.',
      data: error.message,
    });
  }
});

// Need to import getExhibitionById if used in the response, or adjust response.
// For now, let's assume it will be added to the DAO or we simplify the response.
// Adding a placeholder for getExhibitionById to avoid immediate linting errors if not present.
// Ideally, this would be imported from the DAO.
async function getExhibitionById(id: number): Promise<Exhibition | null> {
  // This is a placeholder. Actual implementation is in exhibition-dao.ts
  // and should be imported from there.
  // For now, to make this file self-contained for the tool:
  const { getExhibitionById: getActualExhibitionById } = await import('~/server/utils/dao/exhibition-dao');
  return getActualExhibitionById(id);
}
