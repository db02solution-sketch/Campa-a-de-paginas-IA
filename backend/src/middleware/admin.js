import { verifyAdminToken } from '../services/admin.js';

export function requireAdmin(req, res, next) {
  const token = process.env.ADMIN_TOKEN || 'dev-admin-token';
  const header = req.headers['x-admin-token'];
  const authHeader = req.headers['authorization'];

  // Mode 1: Legacy token for development
  if (header && header === token) {
    return next();
  }

  // Mode 2: Supabase Auth token (Bearer token)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const authToken = authHeader.substring(7);
    verifyAdminToken(authToken)
      .then((isValid) => {
        if (isValid) {
          return next();
        }
        return res.status(401).json({ error: 'No autorizado. Token inválido o admin inactivo.' });
      })
      .catch(() => {
        return res.status(401).json({ error: 'No autorizado. Error de autenticación.' });
      });
    return;
  }

  return res.status(401).json({ error: 'No autorizado. Envía x-admin-token válido o Authorization Bearer token.' });
}