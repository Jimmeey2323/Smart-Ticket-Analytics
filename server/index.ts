import dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { dbReady } from "./db";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await dbReady;
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    // Never throw from Express error middleware; it will crash the process and
    // can cause client-side "glitching" (especially during auth flows).
    console.error("Unhandled error:", err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const explicitPort = process.env.PORT;
  const basePort = parseInt(explicitPort || "5000", 10);
  const canFallbackPorts = !explicitPort && process.env.NODE_ENV !== "production";
  const maxAttempts = canFallbackPorts ? 20 : 1;

  const listenOnce = (port: number) =>
    new Promise<void>((resolve, reject) => {
      const onError = (err: any) => {
        httpServer.off("listening", onListening);
        reject(err);
      };
      const onListening = () => {
        httpServer.off("error", onError);
        resolve();
      };

      httpServer.once("error", onError);
      httpServer.once("listening", onListening);

      // Default listen options. On some macOS/dev environments `reusePort: true`
      // can cause `ENOTSUP` when binding to 0.0.0.0. Avoid reusePort on darwin
      // and fall back to 127.0.0.1 when binding to 0.0.0.0 fails.
      const baseOptions: any = { port, host: "0.0.0.0" };
      if (process.platform !== "darwin") {
        baseOptions.reusePort = true;
      }

      try {
        httpServer.listen(baseOptions);
      } catch (err) {
        // If OS doesn't support those options, try a safe fallback
        httpServer.off("error", onError);
        httpServer.off("listening", onListening);

        // Retry without reusePort and bind to localhost
        const fallbackOptions = { port, host: "127.0.0.1" };
        httpServer.once("error", onError);
        httpServer.once("listening", onListening);
        httpServer.listen(fallbackOptions);
      }
    });

  let lastError: unknown = null;
  for (let i = 0; i < maxAttempts; i++) {
    const port = basePort + i;
    try {
      await listenOnce(port);
      log(`serving on port ${port}`);
      lastError = null;
      break;
    } catch (err: any) {
      lastError = err;
      if (canFallbackPorts && err?.code === "EADDRINUSE") {
        log(`port ${port} already in use, trying ${port + 1}`);
        continue;
      }
      throw err;
    }
  }

  if (lastError) {
    throw lastError;
  }
})();
