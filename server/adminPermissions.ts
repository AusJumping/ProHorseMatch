import type { RequestHandler } from "express";
import { hasRetiredAdminPassword } from "./adminCredentials";

type AdminStore = { getUserById(id: number): Promise<{ email: string; password: string } | undefined> };

// Keep the existing administrator identity; never trust a request body or seller role.
export function createAdminGuard(storage: AdminStore, authenticateToken: RequestHandler): RequestHandler {
  return (req: any, res, next) => {
    const check = async () => {
      try {
        const user = await storage.getUserById(req.userId);
        if (!user || user.email !== "info@australianjumping.com.au") {
          return res.status(403).json({ message: "Administrator access required" });
        }
        if (await hasRetiredAdminPassword(user.password)) {
          return res.status(403).json({ message: "Reset your administrator password before using administrative tools" });
        }
        next();
      } catch {
        res.status(500).json({ message: "Unable to verify administrator access" });
      }
    };
    // Accept legacy sessions as well as current tokens, but don't downgrade an
    // explicitly supplied invalid token to a session.
    if (req.headers.authorization || /(?:^|;\s*)auth_token=/.test(req.headers.cookie || "")) {
      return authenticateToken(req, res, check);
    }
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    req.userId = req.session.userId;
    return check();
  };
}
