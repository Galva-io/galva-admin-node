export * from './billing';

export interface GalvaConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  debug?: boolean;
}

export interface UserIdentifyData {
  userId: string;
  email?: string;
  name?: string;
  attributes?: Record<string, string | number | boolean | null>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    statusCode: number;
  };
}

export interface BatchEventOptions {
  maxBatchSize?: number;
  flushInterval?: number;
}

export class GalvaError extends Error {
  code: string;
  statusCode?: number;
  details?: any;

  constructor(message: string, code: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'GalvaError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}