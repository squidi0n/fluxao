import { NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from './logger';

/**
 * RFC7807 Problem Details
 * https://datatracker.ietf.org/doc/html/rfc7807
 */
export interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  retryAfter?: number;
}

/**
 * Base error class for application errors
 */
export class AppError extends Error {
  public readonly status: number;
  public readonly type: string;
  public readonly detail?: string;
  public readonly instance?: string;
  public readonly extensions?: Record<string, unknown>;

  constructor(
    message: string,
    status: number = 500,
    type?: string,
    detail?: string,
    instance?: string,
    extensions?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.type = type || `https://fluxao.com/errors/${this.name.toLowerCase()}`;
    this.detail = detail;
    this.instance = instance;
    this.extensions = extensions;
    Error.captureStackTrace(this, this.constructor);
  }

  toProblemDetails(): ProblemDetails {
    return {
      type: this.type,
      title: this.message,
      status: this.status,
      detail: this.detail,
      instance: this.instance,
      ...this.extensions,
    };
  }
}

/**
 * Common error classes
 */
export class ValidationError extends AppError {
  constructor(detail: string, errors?: z.ZodIssue[]) {
    super(
      'Validation Error',
      400,
      'https://fluxao.com/errors/validation',
      detail,
      undefined,
      errors ? { errors: formatZodErrors(errors) } : undefined,
    );
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(
      'Resource Not Found',
      404,
      'https://fluxao.com/errors/not-found',
      `The requested ${resource} was not found`,
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(detail?: string) {
    super(
      'Unauthorized',
      401,
      'https://fluxao.com/errors/unauthorized',
      detail || 'Authentication required',
    );
  }
}

export class ForbiddenError extends AppError {
  constructor(detail?: string) {
    super(
      'Forbidden',
      403,
      'https://fluxao.com/errors/forbidden',
      detail || 'You do not have permission to access this resource',
    );
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super(
      'Too Many Requests',
      429,
      'https://fluxao.com/errors/rate-limit',
      'Rate limit exceeded. Please try again later.',
      undefined,
      { retryAfter },
    );
  }
}

export class ConflictError extends AppError {
  constructor(detail: string) {
    super('Conflict', 409, 'https://fluxao.com/errors/conflict', detail);
  }
}

export class InternalServerError extends AppError {
  constructor(detail?: string) {
    super(
      'Internal Server Error',
      500,
      'https://fluxao.com/errors/internal',
      detail || 'An unexpected error occurred',
    );
  }
}

/**
 * Format Zod errors for API response
 */
function formatZodErrors(errors: z.ZodIssue[]): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const error of errors) {
    const path = error.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(error.message);
  }

  return formatted;
}

/**
 * Create a Problem Details response
 */
export function createProblemResponse(
  error: AppError | Error,
  correlationId?: string,
): NextResponse {
  let problem: ProblemDetails;
  let status: number;

  if (error instanceof AppError) {
    problem = error.toProblemDetails();
    status = error.status;
  } else {
    // Generic error handling
    problem = {
      type: 'https://fluxao.com/errors/internal',
      title: 'Internal Server Error',
      status: 500,
      detail:
        process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
    };
    status = 500;
  }

  // Add correlation ID if available
  if (correlationId) {
    problem.instance = correlationId;
  }

  // Log the error
  logger.error(
    {
      correlationId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      problem,
    },
    'API Error',
  );

  // Return Problem+JSON response
  return NextResponse.json(problem, {
    status,
    headers: {
      'Content-Type': 'application/problem+json',
      ...(problem.retryAfter && { 'Retry-After': String(problem.retryAfter) }),
    },
  });
}

/**
 * Error handler for API routes
 */
export function handleApiError(error: unknown, correlationId?: string): NextResponse {
  if (error instanceof z.ZodError) {
    const validationError = new ValidationError('Invalid request data', error.issues);
    return createProblemResponse(validationError, correlationId);
  }

  if (error instanceof AppError) {
    return createProblemResponse(error, correlationId);
  }

  if (error instanceof Error) {
    return createProblemResponse(error, correlationId);
  }

  // Unknown error type
  const unknownError = new InternalServerError('An unknown error occurred');
  return createProblemResponse(unknownError, correlationId);
}
