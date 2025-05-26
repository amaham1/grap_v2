import { defineEventHandler, getRouterParam, createError } from 'h3';
import { logDAO } from '~/server/dao/supabase';


export default defineEventHandler(async (event) => {
  const sourceNameParam = getRouterParam(event, 'sourceName');
  const startTime = new Date();

  if (!sourceNameParam) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Source name is required in the path (e.g., /api/admin/trigger-fetch/festivals).',
    });
  }

  const sourceName = sourceNameParam.toLowerCase(); // Normalize to lowercase

  try {
    let resultMessage = '';
    let fetchPromise;

    switch (sourceName) {
      case 'festivals':
        fetchPromise = $fetch('/api/cron/festivals', { method: 'GET' });
        resultMessage = `Festival data fetch triggered successfully via /api/cron/festivals.`;
        break;
      case 'exhibitions':
        fetchPromise = $fetch('/api/cron/exhibitions', { method: 'GET' });
        resultMessage = `Exhibition data fetch triggered successfully via /api/cron/exhibitions.`;
        break;
      case 'welfare-services':
        fetchPromise = $fetch('/api/cron/welfare-services', { method: 'GET' });
        resultMessage = `Welfare service data fetch triggered successfully via /api/cron/welfare-services.`;
        break;
      case 'gas-stations':
        fetchPromise = $fetch('/api/cron/gas-stations', { method: 'GET' });
        resultMessage = `Gas station data fetch triggered successfully via /api/cron/gas-stations.`;
        break;
      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: `Invalid source name: ${sourceNameParam}. Valid sources are festivals, exhibitions, welfare-services, gas-stations.`,
        });
    }

    // Wait for the internal fetch to complete.
    // The response from the cron job endpoint is not explicitly handled here,
    // but errors during the fetch will be caught.
    await fetchPromise;

    // Log successful manual trigger
    await logDAO.createApiFetchLog({
        source_name: sourceName,
        fetch_timestamp: startTime,
        status: 'SUCCESS',
        retry_count: 0,
        error_message: `Manual fetch triggered successfully for ${sourceName}.`,
        // processed_items, new_items, updated_items can be set if known
    });

    return {
      message: resultMessage,
      source: sourceName,
    };

  } catch (error: any) {
    console.error(`Error triggering fetch for ${sourceName}:`, error);

    let errorMessage = `Failed to trigger data fetch for ${sourceName}.`;
    let errorDetails = error.message || 'Unknown error';
    let statusCode = 500;

    if (error.statusCode) { // Error from createError or $fetch error with status
        statusCode = error.statusCode;
        if (error.data && typeof error.data.message === 'string') {
            errorMessage = error.data.message;
            errorDetails = JSON.stringify(error.data);
        } else if (typeof error.message === 'string') {
            errorMessage = error.message;
        }
    } else if (error.response && error.response._data) { // Specific to ofetch errors without statusCode on error object itself
        const responseData = error.response._data;
        statusCode = error.response.status || 500;
        if (responseData && typeof responseData.message === 'string') {
            errorMessage = responseData.message;
            errorDetails = JSON.stringify(responseData);
        } else if (typeof responseData === 'string') {
            errorMessage = responseData;
            errorDetails = responseData;
        }
    }

    try {
        await logDAO.createApiFetchLog({
            source_name: sourceName,
            fetch_timestamp: startTime,
            status: 'FAILURE',
            retry_count: 0,
            error_message: `Error triggering manual fetch for ${sourceName}: ${errorMessage}`,
            error_details: errorDetails,
        });
    } catch (logError: any) {
        console.error(`Failed to write to logDAO:`, logError);
        // Optionally, append logDAO error to the main error message/details
    }

    throw createError({
        statusCode: statusCode,
        statusMessage: error.statusMessage || (statusCode === 500 ? 'Internal Server Error' : 'Error'),
        message: errorMessage,
    });
  }
});
