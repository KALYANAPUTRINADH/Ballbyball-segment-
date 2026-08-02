import type { Request, Response, NextFunction } from 'express';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from "fs";
import path from "path";
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.warn("Could not load firebase config in auth", e);
}


if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId
  });
}

export interface AuthRequest extends Request {
  user?: any;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1]?.trim();
  
  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({ error: 'Unauthorized: Invalid token string' });
  }


  
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    
    if (!decodedToken || !decodedToken.uid) {
       return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    
    let assignedRole = 'user';
    const cleanPhone = (decodedToken.phone_number || '').replace(/\D/g, '');
    const adminPhones = (process.env.ADMIN_PHONE_NUMBERS || '6305605194,8688678943').split(',');
    
    const isPhoneAdmin = adminPhones.some(p => 
      cleanPhone.endsWith(p) || 
      cleanPhone === p || 
      (decodedToken.uid && decodedToken.uid.includes(p))
    );

    if (isPhoneAdmin) {
      assignedRole = 'admin';
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || '',
      role: assignedRole
    };
    next();
  } catch (error: any) {
    console.warn('Error verifying Firebase ID token. Token:', token, 'Error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};
