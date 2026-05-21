import type { Request, Response } from 'express';
import fs from 'fs';

const DATA_FILE = '/private/lnm-profiles.json';

export default async function handler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!fs.existsSync(DATA_FILE)) return res.status(404).json({ error: 'No profiles found' });

    const profiles: { id: string }[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const updated = profiles.filter(p => p.id !== id);

    if (updated.length === profiles.length) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete profile', message: String(error) });
  }
}
