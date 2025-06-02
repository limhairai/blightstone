import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[PROXY TEST.TS HIT FROM ROOT PAGES!]'); // Added log marker
  res.status(200).json({ message: 'Proxy test endpoint reached from root pages!' });
} 