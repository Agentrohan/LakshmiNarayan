import type { Request, Response } from 'express';
import fs from 'fs';

const DATA_FILE = '/private/lnm-profiles.json';

export default async function handler(_req: Request, res: Response) {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return res.json([]);
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const profiles = JSON.parse(raw);
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load profiles', message: String(error) });
  }
}
