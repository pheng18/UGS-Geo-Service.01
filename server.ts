import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import {
  getAllQuotationsWithItems,
  upsertQuotationWithItems,
  getQuotationDashboardSummary
} from './src/db/quotations.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '5mb' }));

  // GET /api/quotations - Fetch all quotations with line items and total price summary
  app.get('/api/quotations', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.user?.uid) {
        await getOrCreateUser(req.user.uid, req.user.email || 'user@uniqtek.la');
      }
      const quotations = await getAllQuotationsWithItems();
      const report = await getQuotationDashboardSummary();
      res.json({ quotations, report });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch quotations';
      console.error('Failed to fetch quotations:', error);
      res.status(500).json({ error: message });
    }
  });

  // GET /api/quotations/report - Fetch aggregated Total Price report for the Dashboard
  app.get('/api/quotations/report', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.user?.uid) {
        await getOrCreateUser(req.user.uid, req.user.email || 'user@uniqtek.la');
      }
      const report = await getQuotationDashboardSummary();
      res.json(report);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch quotation report';
      console.error('Failed to fetch quotation report:', error);
      res.status(500).json({ error: message });
    }
  });

  // POST /api/quotations - Create or update (Revise) a quotation and its line items
  app.post('/api/quotations', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.user?.uid) {
        await getOrCreateUser(req.user.uid, req.user.email || 'user@uniqtek.la');
      }
      const quotationPayload = req.body;
      if (!quotationPayload || !quotationPayload.id || !quotationPayload.customerName) {
        res.status(400).json({ error: 'Invalid quotation payload' });
        return;
      }
      const saved = await upsertQuotationWithItems(quotationPayload, req.user?.uid);
      const report = await getQuotationDashboardSummary();
      res.json({ quotation: saved, report });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save quotation';
      console.error('Failed to save quotation:', error);
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
