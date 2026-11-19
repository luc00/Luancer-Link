import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { SEED_PROFILES } from './src/data/presets';
import { normalizeHandle } from './src/utils/profileLogic';
import type { BioProfile, ContactSubmission } from './src/types/profile';

const envPort = Number(process.env.PORT);
const nginxPort = Number(process.env.NGINX_PORT);
const PORT =
  envPort && envPort !== nginxPort
    ? envPort
    : Number(process.env.DEFAULT_APP_PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'profiles.json');

function ensureDataStore(): BioProfile[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_PROFILES, null, 2), 'utf-8');
    return JSON.parse(JSON.stringify(SEED_PROFILES)) as BioProfile[];
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as BioProfile[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_PROFILES, null, 2), 'utf-8');
      return JSON.parse(JSON.stringify(SEED_PROFILES)) as BioProfile[];
    }
    return parsed;
  } catch {
    fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_PROFILES, null, 2), 'utf-8');
    return JSON.parse(JSON.stringify(SEED_PROFILES)) as BioProfile[];
  }
}

function saveProfilesToDisk(profiles: BioProfile[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(profiles, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // Initialize store on boot
  ensureDataStore();

  // List all public profiles
  app.get('/api/profiles', (_req, res) => {
    const profiles = ensureDataStore();
    res.json({ profiles });
  });

  // Fetch single profile by handle
  app.get('/api/profiles/:handle', (req, res) => {
    const handle = normalizeHandle(req.params.handle);
    const profiles = ensureDataStore();
    const found = profiles.find((p) => p.handle === handle);
    if (!found) {
      res.status(404).json({ error: 'Profilo non trovato.' });
      return;
    }
    res.json({ profile: found });
  });

  // Create or update a public profile
  app.put('/api/profiles/:handle', (req, res) => {
    const targetHandle = normalizeHandle(req.params.handle);
    const incoming = req.body?.profile as BioProfile | undefined;

    if (!incoming || !targetHandle || targetHandle.length < 2) {
      res.status(400).json({ error: 'Dati profilo o handle non validi.' });
      return;
    }

    const profiles = ensureDataStore();
    const cleanIncomingHandle = normalizeHandle(incoming.handle || targetHandle) || targetHandle;
    const nowIso = new Date().toISOString();

    const sanitized: BioProfile = {
      ...incoming,
      handle: cleanIncomingHandle,
      updatedAt: nowIso,
      displayName: (incoming.displayName || '').trim() || cleanIncomingHandle,
      socials: Array.isArray(incoming.socials) ? incoming.socials : [],
      blocks: Array.isArray(incoming.blocks) ? incoming.blocks : [],
      messages: Array.isArray(incoming.messages) ? incoming.messages : [],
    };

    const existingIdx = profiles.findIndex(
      (p) => p.id === sanitized.id || p.handle === targetHandle
    );

    // Check handle collision against a different profile
    const conflictIdx = profiles.findIndex(
      (p, idx) => p.handle === cleanIncomingHandle && idx !== existingIdx
    );
    if (conflictIdx !== -1) {
      res.status(409).json({
        error: `L'handle @${cleanIncomingHandle} è già utilizzato da un altro profilo.`,
      });
      return;
    }

    if (existingIdx >= 0) {
      profiles[existingIdx] = sanitized;
    } else {
      profiles.unshift(sanitized);
    }

    saveProfilesToDisk(profiles);
    res.json({ profile: sanitized, profiles });
  });

  // Delete a public profile (keep at least 1)
  app.delete('/api/profiles/:handle', (req, res) => {
    const handle = normalizeHandle(req.params.handle);
    const profiles = ensureDataStore();
    if (profiles.length <= 1) {
      res.status(400).json({ error: 'Deve rimanere almeno un profilo pubblico.' });
      return;
    }
    const next = profiles.filter((p) => p.handle !== handle);
    if (next.length === profiles.length) {
      res.status(404).json({ error: 'Profilo non trovato.' });
      return;
    }
    saveProfilesToDisk(next);
    res.json({ profiles: next });
  });

  // Increment click count on a block or nested grid item
  app.post('/api/profiles/:handle/click', (req, res) => {
    const handle = normalizeHandle(req.params.handle);
    const { blockId, gridItemId } = req.body || {};
    const profiles = ensureDataStore();
    const profile = profiles.find((p) => p.handle === handle);
    if (!profile) {
      res.status(404).json({ error: 'Profilo non trovato.' });
      return;
    }

    const block = profile.blocks.find((b) => b.id === blockId);
    if (block) {
      if (gridItemId) {
        const gridMatch = block.gridItems?.find((g) => g.id === gridItemId);
        const photoMatch = block.photoGridItems?.find((g) => g.id === gridItemId);
        const socialMatch = block.socialGridItems?.find((g) => g.id === gridItemId);
        if (gridMatch) gridMatch.clicks = (gridMatch.clicks || 0) + 1;
        else if (photoMatch) photoMatch.clicks = (photoMatch.clicks || 0) + 1;
        else if (socialMatch) socialMatch.clicks = (socialMatch.clicks || 0) + 1;
        else block.clicks = (block.clicks || 0) + 1;
      } else {
        block.clicks = (block.clicks || 0) + 1;
      }
      saveProfilesToDisk(profiles);
    }

    res.json({ profile });
  });

  // Increment view count
  app.post('/api/profiles/:handle/view', (req, res) => {
    const handle = normalizeHandle(req.params.handle);
    const profiles = ensureDataStore();
    const profile = profiles.find((p) => p.handle === handle);
    if (!profile) {
      res.status(404).json({ error: 'Profilo non trovato.' });
      return;
    }
    profile.views = (profile.views || 0) + 1;
    saveProfilesToDisk(profiles);
    res.json({ views: profile.views });
  });

  // Save visitor message from a Contact/Newsletter block
  app.post('/api/profiles/:handle/messages', (req, res) => {
    const handle = normalizeHandle(req.params.handle);
    const { senderName, senderEmail, message } = req.body || {};
    if (!senderEmail || !String(senderEmail).includes('@')) {
      res.status(400).json({ error: 'Inserisci un indirizzo email valido.' });
      return;
    }

    const profiles = ensureDataStore();
    const profile = profiles.find((p) => p.handle === handle);
    if (!profile) {
      res.status(404).json({ error: 'Profilo non trovato.' });
      return;
    }

    const submission: ContactSubmission = {
      id: `msg_${Date.now().toString(36)}`,
      senderName: String(senderName || 'Visitatore').trim(),
      senderEmail: String(senderEmail).trim(),
      message: String(message || 'Iscrizione / Richiesta rapida').trim(),
      createdAt: new Date().toISOString(),
    };

    profile.messages = [submission, ...(profile.messages || [])];
    saveProfilesToDisk(profiles);
    res.status(201).json({ submission, profile });
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LinkMe Bio server attivo su http://localhost:${PORT}`);
  });
}

startServer();
