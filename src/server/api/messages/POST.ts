import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const DATA_FILE = '/private/lnm-messages.json';

export default async function handler(req: Request, res: Response) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let messages: object[] = [];
    if (fs.existsSync(DATA_FILE)) {
      try { messages = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); } catch (_) {}
    }

    const msg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sentAt: new Date().toISOString(),
      read: false,
      ...req.body,
    };

    messages.unshift(msg); // newest first
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2), 'utf-8');
    res.status(201).json({ success: true, id: msg.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save message', message: String(error) });
  }
}
