const express = require('express');
const { body } = require('express-validator');
const {
    createBoard,
    getBoards,
    getBoardById,
    updateBoard,
    deleteBoard,
    addMember,
    removeMember
} = require('../controllers/boardController');
const auth = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Validation middleware
const boardValidation = [
    body('title')
        .isLength({ min: 1 })
        .withMessage('Board title is required')
        .trim()
        .escape(),
    body('description')
        .optional()
        .trim()
        .escape()
];

// Routes
router.post('/', boardValidation, createBoard);
router.get('/', getBoards);
router.get('/:id', getBoardById);
router.put('/:id', boardValidation, updateBoard);
router.delete('/:id', deleteBoard);
router.post('/:id/members', addMember);
router.delete('/:id/members/:memberId', removeMember);

module.exports = router;



