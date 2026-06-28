import { Router } from 'express';
import { getFirebaseAuth } from '../config/firebase.js';
import { getFirestoreDb } from '../config/firebase.js';
import type { ApiResponse, UserProfile } from '../types/index.js';

const router = Router();

/**
 * POST /api/auth/login
 * Verify a Firebase ID token and return user profile.
 */
router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken || typeof idToken !== 'string') {
      res.status(400).json({
        success: false,
        error: 'idToken is required',
      } satisfies ApiResponse);
      return;
    }

    const decoded = await getFirebaseAuth().verifyIdToken(idToken);

    // Upsert user profile in Firestore
    const db = getFirestoreDb();
    const userRef = db.collection('users').doc(decoded.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      const profile: UserProfile = {
        uid: decoded.uid,
        email: decoded.email ?? '',
        displayName: decoded.name ?? 'User',
        createdAt: { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 },
      };
      await userRef.set(profile);
    }

    res.json({
      success: true,
      data: {
        uid: decoded.uid,
        email: decoded.email,
        displayName: decoded.name ?? 'User',
      },
      message: 'Authenticated successfully',
    } satisfies ApiResponse);
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    } satisfies ApiResponse);
  }
});

/**
 * POST /api/auth/register
 * Register a new user (creates Firebase user + profile document).
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      } satisfies ApiResponse);
      return;
    }

    const userRecord = await getFirebaseAuth().createUser({
      email,
      password,
      displayName: displayName ?? email.split('@')[0],
    });

    // Create user profile
    const db = getFirestoreDb();
    const profile: UserProfile = {
      uid: userRecord.uid,
      email: userRecord.email ?? email,
      displayName: userRecord.displayName ?? email.split('@')[0],
      createdAt: { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 },
    };
    await db.collection('users').doc(userRecord.uid).set(profile);

    res.status(201).json({
      success: true,
      data: { uid: userRecord.uid, email: userRecord.email, displayName: userRecord.displayName },
      message: 'User registered successfully',
    } satisfies ApiResponse);
  } catch (error: unknown) {
    console.error('[Auth] Register error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ success: false, error: message } satisfies ApiResponse);
  }
});

/**
 * GET /api/auth/profile
 * Get the current user's profile (requires auth middleware).
 */
router.get('/profile', async (req, res) => {
  try {
    const db = getFirestoreDb();
    const userDoc = await db.collection('users').doc(req.user!.uid).get();

    if (!userDoc.exists) {
      res.status(404).json({ success: false, error: 'User profile not found' } satisfies ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: { id: userDoc.id, ...userDoc.data() },
    } satisfies ApiResponse);
  } catch (error) {
    console.error('[Auth] Profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' } satisfies ApiResponse);
  }
});

export default router;
