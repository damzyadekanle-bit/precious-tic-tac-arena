import type { Request, Response } from 'express';
export const healthController = (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'tic-tac-arena-backend' });
};
