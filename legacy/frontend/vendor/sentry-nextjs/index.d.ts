export interface InitOptions {
  dsn?: string;
  environment?: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
}

export function init(options: InitOptions): void;
export function captureException(error: unknown, context?: { extra?: Record<string, unknown> }): void;
export function captureMessage(message: string, context?: { extra?: Record<string, unknown> }): void;
