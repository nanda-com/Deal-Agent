import type { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth, isFirebaseInitialized } from '../config/firebase.js';
import type { ApiResponse } from '../types/index.js';

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        displayName?: string;
        photoURL?: string;
      };
    }
  }
}

/**
 * Check if demo mode is enabled (allows testing without Firebase Auth).
 * Enable by setting DEMO_MODE=true in .env, or by passing x-demo-token header.
 */
function isDemoMode(req: Request): { enabled: boolean; reason?: string } {
  // Check header override first (for Postman testing)
  if (req.headers['x-demo-token'] === process.env.DEMO_TOKEN) {
    return { enabled: true, reason: 'x-demo-token header' };
  }

  // Check .env config
  if (process.env.DEMO_MODE === 'true' || process.env.DEMO_MODE === '1') {
    return { enabled: true, reason: 'DEMO_MODE env var' };
  }

  // Check if Firebase is not initialized (auto-enable demo)
  if (!isFirebaseInitialized()) {
    return { enabled: true, reason: 'Firebase not configured' };
  }

  return { enabled: false };
}

/** Demo user used when Firebase Auth is unavailable */
const DEMO_USER = {
  uid: 'demo-user-001',
  email: 'demo@omniflow.ai',
  displayName: 'Demo User',
  photoURL: undefined,
};

/**
 * Middleware to verify Firebase ID token from Authorization header.
 * Falls back to demo mode when Firebase is unavailable or DEMO_MODE is enabled.
 *
 * Expects header: "Authorization: Bearer <firebase-id-token>"
 * Or for demo: "x-demo-token: <DEMO_TOKEN from .env>"
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const demo = isDemoMode(req);
    if (demo.enabled) {
      console.log('[Auth] Demo mode active (' + demo.reason + ') — using demo user');
      req.user = DEMO_USER;
      next();
      return;
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid Authorization header. Expected: Bearer <token>',
      } satisfies ApiResponse);
      return;
    }

    const token = authHeader.split('Bearer ')[1]?.trim();
    if (!token) {
      res.status(401).json({ success: false, error: 'Token is empty' } satisfies ApiResponse);
      return;
    }

    const decoded = await getFirebaseAuth().verifyIdToken(token);

    req.user = {
      uid: decoded.uid,
      email: decoded.email ?? '',
      displayName: decoded.name,
      photoURL: decoded.picture,
    };

    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token. Please sign in again.',
    } satisfies ApiResponse);
  }
}

/**
 * Optional auth - sets req.user if valid token present, but doesn't block.
 * Also supports demo mode.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const demo = isDemoMode(req);
  if (demo.enabled) {
    req.user = DEMO_USER;
    next();
    return;
  }

  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1]?.trim();
      if (token) {
        const decoded = await getFirebaseAuth().verifyIdToken(token);
        req.user = {
          uid: decoded.uid,
          email: decoded.email ?? '',
          displayName: decoded.name,
          photoURL: decoded.picture,
        };
      }
    }
  } catch {
    // Silently ignore - user remains unauthenticated
  }
  next();
}
