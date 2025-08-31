const express = require('express');
const { body } = require('express-validator');
const {
    createList,
    getLists,
    updateList,
    deleteList,
    moveList
} = require('../controllers/listController');
const auth = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Validation middleware
const listValidation = [
    body('title')
        .isLength({ min: 1 })
        .withMessage('List title is required')
        .trim()
        .escape(),
    body('board')
        .isMongoId()
        .withMessage('Valid board ID is required')
];

const moveListValidation = [
    body('newPosition')
        .isInt({ min: 0 })
        .withMessage('New position must be a non-negative integer')
];

// Routes
router.post('/', listValidation, createList);
router.get('/board/:boardId', getLists);
router.put('/:id', listValidation, updateList);
router.delete('/:id', deleteList);
router.put('/:id/move', moveListValidation, moveList);

module.exports = router;



