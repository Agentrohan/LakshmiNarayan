import type { Request, Response } from 'express';
import fs from 'fs';

const DATA_FILE = '/private/lnm-messages.json';

export default async function handler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!fs.existsSync(DATA_FILE)) return res.status(404).json({ error: 'No messages found' });

    const messages: { id: string; read?: boolean }[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const msg = messages.find(m => m.id === id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    Object.assign(msg, req.body);
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update message', message: String(error) });
  }
}
