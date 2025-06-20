import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import bcrypt from 'bcrypt';

// Session-based authentication middleware
export function isAuthenticated(req: any, res: Response, next: NextFunction) {
  console.log("Session auth check - userId:", req.session?.userId);
  
  if (req.session?.userId) {
    return next();
  }
  
  return res.status(401).json({ message: 'Not authenticated' });
}

// Login handler
export async function handleLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set session
    (req as any).session.userId = user.id;
    (req as any).session.userType = user.is_selling ? 'owner' : 'customer';
    
    console.log("Session auth - Login successful:", {
      userId: user.id,
      sessionId: req.sessionID
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Session auth - Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Get current user
export async function getCurrentUser(req: any, res: Response) {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    console.log("Session auth - Current user fetched:", {
      userId: user.id,
      sessionId: req.sessionID
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Session auth - Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Logout handler
export function handleLogout(req: any, res: Response) {
  const sessionId = req.sessionID;
  
  req.session.destroy((err: any) => {
    if (err) {
      console.error('Session auth - Logout error:', err);
      return res.status(500).json({ message: 'Could not log out' });
    }
    
    console.log("Session auth - Logout successful:", { sessionId });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
}