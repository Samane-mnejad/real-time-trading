import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { User } from '../types/auth';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const createAuthMiddleware = (authService: AuthService) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ 
          error: 'Authorization token required' 
        });
      }

      const user = await authService.verifyToken(token);
      
      if (!user) {
        return res.status(401).json({ 
          error: 'Invalid or expired token' 
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ 
        error: 'Authentication failed' 
      });
    }
  };
}; 