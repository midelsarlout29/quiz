const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'User tidak valid' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      roleLabel: user.role.label
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    const effectiveRole = req.user?.role === 'super_admin' ? 'admin' : req.user?.role;
    if (!req.user || !roles.includes(effectiveRole)) {
      return res.status(403).json({ message: 'Akses tidak diizinkan untuk role ini' });
    }
    next();
  };
}

module.exports = { authenticate, allowRoles };
