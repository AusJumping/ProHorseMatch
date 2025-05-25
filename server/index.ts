import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // CRITICAL: Register messaging routes BEFORE Vite middleware to prevent HTML interference
  const { storage } = await import("./storage");
  
  const isAuth = (req: any, res: any, next: any) => {
    if (req.session && req.session.userId) {
      next();
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  };

  // Alternative messaging endpoint using GET with query parameters to bypass Vite middleware
  app.get("/api/message-send", isAuth, async (req: any, res: any) => {
    try {
      console.log("GET MESSAGE ENDPOINT - Query:", req.query);
      const userId = req.session.userId;
      const conversation_id = parseInt(req.query.cid);
      const content = decodeURIComponent(req.query.msg);
      
      const conversation = await storage.getConversationById(conversation_id);
      if (!conversation || (conversation.customer_id !== userId && conversation.owner_id !== userId)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const senderType = conversation.customer_id === userId ? "customer" : "owner";
      const newMessage = await storage.createMessage({
        conversation_id, sender_id: userId, sender_type: senderType, content, is_read: false,
      });

      console.log("GET MESSAGE - Message created:", newMessage);
      
      const isCustomer = conversation.customer_id === userId;
      await storage.updateConversation(conversation_id, {
        last_message_time: new Date(), is_read_by_customer: isCustomer, is_read_by_owner: !isCustomer,
      });

      res.setHeader('Content-Type', 'application/json');
      return res.json(newMessage);
    } catch (error) {
      console.error("GET MESSAGE - Error:", error);
      return res.status(500).json({ message: "Failed to send message" });
    }
  });

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
