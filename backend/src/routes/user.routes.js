const bcrypt = require('bcryptjs');
const express = require('express');
const prisma = require('../prisma');
const { authenticate, allowRoles } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(authenticate, allowRoles('admin'));

router.get('/', asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(users.map(({ passwordHash, ...user }) => user));
}));

router.post('/', asyncHandler(async (req, res) => {
  const role = await prisma.role.findUnique({ where: { name: req.body.role || 'participant' } });
  const passwordHash = await bcrypt.hash(req.body.password || 'password123', 10);
  const user = await prisma.user.create({
    data: {
      name: req.body.name,
      email: req.body.email,
      passwordHash,
      roleId: role.id,
      institution: req.body.institution || null,
      phone: req.body.phone || null
    },
    include: { role: true }
  });
  delete user.passwordHash;
  res.status(201).json(user);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const role = req.body.role ? await prisma.role.findUnique({ where: { name: req.body.role } }) : null;
  const user = await prisma.user.update({
    where: { id: Number(req.params.id) },
    data: {
      name: req.body.name,
      email: req.body.email,
      roleId: role?.id,
      institution: req.body.institution,
      phone: req.body.phone
    },
    include: { role: true }
  });
  delete user.passwordHash;
  res.json(user);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.user.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
}));

module.exports = router;
