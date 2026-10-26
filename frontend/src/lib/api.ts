import type { ErrorBody } from './types';

/** 백엔드가 돌려준 ErrorResponse(code, message, details)를 그대로 담는 에러. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: string[];

  constructor(status: number, body: ErrorBody) {
    super(body.message);
    this.status = status;
    this.code = body.code;
    this.details = body.details ?? [];
  }
}

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, {
      code: 'NETWORK',
      message: '서버에 연결하지 못했어요. 백엔드(8080)가 켜져 있는지 확인하세요.',
      details: [],
    });
  }

  const text = await response.text();
  const json = text ? safeParse(text) : null;
  if (!response.ok) {
    const fallback: ErrorBody = { code: 'HTTP_' + response.status, message: '요청을 처리하지 못했어요.', details: [] };
    throw new ApiError(response.status, isErrorBody(json) ? json : fallback);
  }
  return json as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isErrorBody(value: unknown): value is ErrorBody {
  return typeof value === 'object' && value !== null && 'code' in value && 'message' in value;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
};
