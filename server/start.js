import { createServer as createViteServer } from 'vite';
import { createServer as createAppServer } from './index.js';

const PORT = Number(process.env.PORT || 3000);

async function bootstrap() {
  const app = await createAppServer();

  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      allowedHosts: true,
    },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[XPGAMPP] Control Panel & Runtime listening on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[XPGAMPP] Failed to start server:', err);
  process.exit(1);
});
