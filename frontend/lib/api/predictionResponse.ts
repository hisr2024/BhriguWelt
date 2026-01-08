export type PredictionEnvelope<T = unknown> = {
  status: 'success' | 'error';
  prediction: T | null;
  metadata?: Record<string, any> | null;
  message?: string;
};

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
  } else if (response.data?.prediction !== undefined) {
    prediction = response.data.prediction;
    metadata = metadata ?? response.data.metadata ?? null;
  } else if (response.data !== undefined) {
    prediction = response.data;
    metadata = metadata ?? response.data.metadata ?? null;
  } else {
    prediction = response;
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
