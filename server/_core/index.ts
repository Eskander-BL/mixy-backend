import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerWebhooks } from "./webhooks";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Webhooks Stripe : corps brut requis pour la signature — avant express.json()
  registerWebhooks(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // CORS configuration for cross-origin requests
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const fromEnv =
      process.env.ALLOWED_ORIGINS?.split(",")
        .map(s => s.trim().replace(/\/$/, ""))
        .filter(Boolean) ?? [];
    // Vercel + localhost defaults; add production / custom domains via ALLOWED_ORIGINS on Railway
    const allowedOrigins = [
      "https://mixy.com",
      "https://www.mixy.com",
      "https://mixyia.com",
      "https://www.mixyia.com",
      "https://mixy-frontend.vercel.app",
      "https://mixy-frontend-git-main-eskanders-projects.vercel.app",
      "https://mixy-frontend-abae4calx-eskanders-projects.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:3001",
      ...fromEnv,
    ];
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Plain HTTP checks (Railway / uptime); API métier reste sur /api/trpc
  app.get("/", (_req, res) => {
    res.json({
      ok: true,
      service: "mixy-api",
      trpc: "/api/trpc",
    });
  });
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
