const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { loginSchema, registerSchema, validate } = require('../utils/validators');

const router = express.Router();

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role.name }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    institution: user.institution,
    phone: user.phone,
    role: user.role.name,
    roleLabel: user.role.label
  };
}

router.post('/register', asyncHandler(async (req, res) => {
  const data = validate(registerSchema, req.body);
  const role = await prisma.role.findUnique({ where: { name: data.role } });
  if (!role) return res.status(422).json({ message: 'Role tidak valid' });

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      roleId: role.id,
      institution: data.institution,
      phone: data.phone
    },
    include: { role: true }
  });

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const data = validate(loginSchema, req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email }, include: { role: true } });
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    return res.status(401).json({ message: 'Email atau password salah' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { role: true } });
  res.json(publicUser(user));
}));

router.put('/profile', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      name: String(req.body.name || '').trim() || req.user.name,
      institution: req.body.institution || null,
      phone: req.body.phone || null
    },
    include: { role: true }
  });
  res.json(publicUser(user));
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword || String(newPassword).length < 8) {
    return res.status(422).json({ message: 'Email dan password baru minimal 8 karakter wajib diisi' });
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { email }, data: { passwordHash } }).catch(() => null);
  res.json({ message: 'Jika email terdaftar, password telah diperbarui.' });
}));

module.exports = router;
