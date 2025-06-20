import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import bcrypt from 'bcrypt';

// Session-based authentication middleware
export function isAuthenticated(req: any, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    return next();
  }
  return res.status(401).json({ message: 'Not authenticated' });
}

// Login endpoint
export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set session
    (req as any).session.userId = user.id;
    (req as any).session.userType = user.is_selling ? 'owner' : 'customer';

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Login error:', error);
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

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Logout
export function logoutUser(req: any, res: Response) {
  req.session.destroy((err: any) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
}