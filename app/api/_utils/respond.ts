import { NextResponse } from 'next/server';

import { ProblemDetails } from '@/lib/errors';

/**
 * Create a Problem+JSON response
 */
export function problemJSON(problem: ProblemDetails, headers?: HeadersInit): NextResponse {
  return NextResponse.json(problem, {
    status: problem.status,
    headers: {
      'Content-Type': 'application/problem+json',
      ...headers,
    },
  });
}

/**
 * Create a success JSON response
 */
export function successJSON<T>(data: T, status: number = 200, headers?: HeadersInit): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/**
 * Create a no content response
 */
export function noContent(headers?: HeadersInit): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers,
  });
}
