export type PredictionEnvelope<T = unknown> = {
  status: 'success' | 'error';
  prediction: T | null;
  metadata?: Record<string, any> | null;
  message?: string;
};

/**
 * Normalize prediction API response to a consistent envelope format
 * Handles various response structures and ensures subcategories are preserved
 */
export const normalizePredictionResponse = <T = unknown>(response: any): PredictionEnvelope<T> => {
  if (!response) {
    return {
      status: 'error',
      prediction: null,
      metadata: null,
      message: 'No response payload returned.',
    };
  }

  const status: 'success' | 'error' =
    response.status === 'error' || response.error ? 'error' : 'success';

  const message = response.message || response.error || response.error_message;

  let metadata = response.metadata ?? null;
  let prediction: any = null;

  if (response.prediction !== undefined) {
    prediction = response.prediction;
    // If prediction is an object with subcategories, preserve the structure
    if (prediction && typeof prediction === 'object' && prediction.subcategories) {
      // Ensure subcategories are preserved in the prediction object
      metadata = metadata ?? prediction.metadata ?? null;
    }
  } else if (response.data?.prediction !== undefined) {
    prediction = response.data.prediction;
    metadata = metadata ?? response.data.metadata ?? null;
  } else if (response.data !== undefined) {
    prediction = response.data;
    metadata = metadata ?? response.data.metadata ?? null;
  } else {
    prediction = response;
  }

  // If prediction is a structured object with subcategories, ensure it's properly formatted
  if (prediction && typeof prediction === 'object') {
    // Ensure full_analysis is at top level if available
    if (prediction.full_analysis && !prediction.prediction) {
      prediction.prediction = prediction.full_analysis;
    }
    // Merge metadata if both exist
    if (prediction.metadata && metadata) {
      metadata = { ...metadata, ...prediction.metadata };
    } else if (prediction.metadata) {
      metadata = prediction.metadata;
    }
  }

  return {
    status,
    prediction,
    metadata,
    message,
  };
};

export const unwrapPredictionPayload = <T = unknown>(response: any): T => {
  return normalizePredictionResponse<T>(response).prediction as T;
};
