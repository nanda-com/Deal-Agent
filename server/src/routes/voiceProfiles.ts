import { Router } from 'express';
import multer from 'multer';
import { getVoiceProfiles, createVoiceProfile, updateVoiceProfile, deleteVoiceProfile } from '../services/dataService.js';
import { isFirebaseInitialized, getFirebaseApp } from '../config/firebase.js';
import { getStorage } from 'firebase-admin/storage';
import type { ApiResponse } from '../types/index.js';

const router = Router();

// Simple multer memory storage for demo / mock
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

/** GET /api/voice-profiles - list */
router.get('/', async (req, res, next) => {
  try {
    const profiles = await getVoiceProfiles();
    res.json({ success: true, data: profiles } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
});

/** POST /api/voice-profiles - create profile with optional sample upload */
router.post('/', upload.single('sample'), async (req, res, next) => {
  try {
    const { name, type, description, accent, speed, gender } = req.body;

    if (!name || !type) {
      res.status(400).json({ success: false, error: 'name and type are required' } satisfies ApiResponse);
      return;
    }

    // If Firebase is configured and a sample was uploaded, persist to Firebase Storage and return a real URL.
    let sampleUrl: string | undefined = undefined;
    const sampleBuffer = (req.file && req.file.buffer) ? req.file.buffer : null;

    if (sampleBuffer && isFirebaseInitialized()) {
      try {
          const app = getFirebaseApp();
          const storage = getStorage(app);
          const bucket = storage.bucket();
          const filename = `voice-samples/${Date.now()}-${req.file?.originalname}`.replace(/\s+/g, '_');
          const file = bucket.file(filename);
          await file.save(sampleBuffer, { resumable: false, contentType: req.file?.mimetype || 'audio/mpeg' });
        // Make public for demo purposes; for production consider signed URLs and ACLs
        try { await file.makePublic(); } catch {}
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        sampleUrl = publicUrl;
      } catch (err) {
        console.warn('[VoiceProfiles] Firebase storage upload failed, falling back to mock URL', err);
        sampleUrl = `/mock/uploads/${Date.now()}-${req.file?.originalname}`;
      }
    } else {
      sampleUrl = sampleBuffer ? `/mock/uploads/${Date.now()}-${req.file?.originalname}` : undefined;
    }

    const profile = await createVoiceProfile({ name, type, description, accent, speed, gender, sampleUrl });

    res.status(201).json({ success: true, data: profile } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/voice-profiles/:id - update (toggle active or metadata) */
router.patch('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    const updated = await updateVoiceProfile(id, updates);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Profile not found' } satisfies ApiResponse);
      return;
    }
    res.json({ success: true, data: updated } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/voice-profiles/:id */
router.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const ok = await deleteVoiceProfile(id);
    if (!ok) {
      res.status(404).json({ success: false, error: 'Profile not found' } satisfies ApiResponse);
      return;
    }
    res.json({ success: true, message: 'Deleted' } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
});

export default router;
