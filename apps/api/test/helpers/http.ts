import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface MockVercelRequest extends Partial<VercelRequest> {
  method?: string;
  query?: Record<string, string | string[]>;
  body?: any;
  headers?: Record<string, string | string[]>;
  url?: string;
}

export interface MockVercelResponse extends Partial<VercelResponse> {
  statusCode?: number;
  body?: any;
  headers: Record<string, string>;
  status: (code: number) => MockVercelResponse;
  json: (data: any) => MockVercelResponse;
  send: (data: any) => MockVercelResponse;
  end: () => MockVercelResponse;
}

export interface RequestOptions {
  method?: string;
  query?: Record<string, string | string[]>;
  body?: any;
  headers?: Record<string, string | string[]>;
  url?: string;
}

/**
 * Build mock Vercel request and response objects for testing handlers
 */
export function buildReqRes(options: RequestOptions = {}): {
  req: MockVercelRequest;
  res: MockVercelResponse;
} {
  const req: MockVercelRequest = {
    method: options.method || 'GET',
    query: options.query || {},
    body: options.body,
    headers: options.headers || {},
    url: options.url || '/',
  };

  let statusCode = 200;
  let responseBody: any = null;
  const responseHeaders: Record<string, string> = {};

  const res: MockVercelResponse = {
    statusCode,
    body: responseBody,
    headers: responseHeaders,
    status: function (code: number) {
      statusCode = code;
      this.statusCode = code;
      return this;
    },
    json: function (data: any) {
      responseBody = data;
      this.body = data;
      return this;
    },
    send: function (data: any) {
      responseBody = data;
      this.body = data;
      return this;
    },
    end: function () {
      return this;
    },
  };

  return { req: req as VercelRequest, res: res as VercelResponse };
}

/**
 * Extract response data from mock response
 */
export function getResponseData(res: MockVercelResponse): {
  statusCode: number;
  body: any;
  headers: Record<string, string>;
} {
  return {
    statusCode: res.statusCode || 200,
    body: res.body,
    headers: res.headers || {},
  };
}

