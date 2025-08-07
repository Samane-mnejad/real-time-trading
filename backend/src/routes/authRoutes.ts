import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { LoginCredentials } from '../types/auth';

export function createAuthRoutes(authService: AuthService): Router {
  const router = Router();

  // POST /auth/login
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const credentials: LoginCredentials = req.body;
      
      if (!credentials.email || !credentials.password) {
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }

      const authResponse = await authService.login(credentials);
      
      res.json(authResponse);
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ 
        error: error instanceof Error ? error.message : 'Login failed' 
      });
    }
  });

  // POST /auth/logout
  router.post('/logout', async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        await authService.logout(token);
      }
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ 
        error: 'Logout failed' 
      });
    }
  });

  // GET /auth/me
  router.get('/me', async (req: Request, res: Response) => {
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

      res.json({ user });
    } catch (error) {
      console.error('Auth verification error:', error);
      res.status(500).json({ 
        error: 'Authentication verification failed' 
      });
    }
  });

  // POST /auth/refresh
  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ 
          error: 'Authorization token required' 
        });
      }

      const authResponse = await authService.refreshToken(token);
      
      if (!authResponse) {
        return res.status(401).json({ 
          error: 'Invalid or expired token' 
        });
      }

      res.json(authResponse);
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({ 
        error: 'Token refresh failed' 
      });
    }
  });

  return router;
} 