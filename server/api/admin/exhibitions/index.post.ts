import { defineEventHandler, readBody } from 'h3';
import { upsertExhibition, getExhibitionById, Exhibition } from '~/server/dao/supabase/exhibition-dao';

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

    const result = await upsertExhibition(exhibitionData);

    if (result && result.data && result.data.length > 0) {
      const newExhibition = result.data[0];
      return {
        statusCode: 201,
        statusMessage: 'Exhibition created successfully',
        data: newExhibition,
      };
    } else {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create exhibition: No data returned',
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


