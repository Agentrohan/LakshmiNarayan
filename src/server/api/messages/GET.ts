import type { Request, Response } from 'express';
import fs from 'fs';

const DATA_FILE = '/private/lnm-messages.json';

export default async function handler(_req: Request, res: Response) {
  try {
    if (!fs.existsSync(DATA_FILE)) return res.json([]);
    const messages = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load messages', message: String(error) });
  }
}
