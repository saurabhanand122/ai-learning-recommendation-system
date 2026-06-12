import { createClerkClient, verifyToken } from '@clerk/backend';
import { CLERK_SECRET_KEY } from '../config/env.js';

let clerk = null;
if (CLERK_SECRET_KEY && !CLERK_SECRET_KEY.includes('placeholder')) {
  clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });
}

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthenticated. Missing Authorization header.' });
    }

    const token = authHeader.split(' ')[1];

    // Development bypass if Clerk keys are not set up yet
    if (!clerk) {
      // Look for a mock user details header, or use default
      const mockEmail = req.headers['x-mock-email'] || 'student@example.com';
      const mockName = req.headers['x-mock-name'] || 'John Doe';
      const mockRole = req.headers['x-mock-role'] || 'student'; // student, admin, pod
      const mockUserId = req.headers['x-mock-user-id'] || 'user_mock_student_1';

      req.auth = {
        userId: mockUserId,
        email: mockEmail,
        name: mockName,
        role: mockRole,
        isMock: true
      };
      return next();
    }

    // Verify token with Clerk
    const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
    
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }

    // Fetch user details from Clerk using user ID from payload
    const user = await clerk.users.getUser(payload.sub);

    req.auth = {
      userId: payload.sub,
      email: user.emailAddresses[0]?.emailAddress || '',
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
      // Get role from Clerk metadata if set
      role: user.publicMetadata?.role || 'student',
      isMock: false
    };

    next();
  } catch (error) {
    console.error('[AUTH ERROR]', error);
    if (error.message?.includes('expired') || error.reason === 'token-expired' || error.message?.includes('JWT') || error.message?.includes('token')) {
      return res.status(401).json({ error: 'Authentication token is expired or invalid. Please sign in again.' });
    }
    res.status(500).json({ error: 'Internal server error verifying token.' });
  }
}

// Middleware to restrict access by role
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Unauthenticated.' });
    }
    const userRole = req.auth.role || 'student';
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: `Forbidden. Requires one of the following roles: ${allowedRoles.join(', ')}` });
    }
    next();
  };
}
