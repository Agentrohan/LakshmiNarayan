import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const DATA_FILE = '/private/lnm-profiles.json';

export default async function handler(req: Request, res: Response) {
  try {
    // Ensure /private directory exists
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Load existing profiles
    let profiles: object[] = [];
    if (fs.existsSync(DATA_FILE)) {
      try {
        profiles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      } catch (_) {
        profiles = [];
      }
    }

    // Add new profile with ID and timestamp
    const newProfile = {
      id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      submittedAt: new Date().toISOString(),
      ...req.body,
    };

    profiles.push(newProfile);
    fs.writeFileSync(DATA_FILE, JSON.stringify(profiles, null, 2), 'utf-8');

    res.status(201).json({ success: true, id: newProfile.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save profile', message: String(error) });
  }
}
