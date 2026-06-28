import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '../types/index.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[Error]', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    } satisfies ApiResponse);
    return;
  }

  // Firebase Auth errors
  if (err.name === 'FirebaseAuthError') {
    res.status(401).json({
      success: false,
      error: 'Authentication failed. Please sign in again.',
    } satisfies ApiResponse);
    return;
  }

  // Validation / Syntax errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body.',
    } satisfies ApiResponse);
    return;
  }

  // Default 500
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  } satisfies ApiResponse);
}
