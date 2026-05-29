const express = require('express');
const prisma = require('../prisma');
const { authenticate, allowRoles } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json(categories);
}));

router.post('/', authenticate, allowRoles('admin', 'creator'), asyncHandler(async (req, res) => {
  const category = await prisma.category.create({
    data: { name: req.body.name, description: req.body.description || null }
  });
  res.status(201).json(category);
}));

router.put('/:id', authenticate, allowRoles('admin', 'creator'), asyncHandler(async (req, res) => {
  const category = await prisma.category.update({
    where: { id: Number(req.params.id) },
    data: { name: req.body.name, description: req.body.description || null }
  });
  res.json(category);
}));

router.delete('/:id', authenticate, allowRoles('admin'), asyncHandler(async (req, res) => {
  await prisma.category.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
}));

module.exports = router;
