const express = require('express');
const { body } = require('express-validator');
const {
    createCard,
    getCards,
    updateCard,
    deleteCard,
    moveCard,
    addComment,
    searchCards
} = require('../controllers/cardController');
const auth = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Validation middleware
const cardValidation = [
    body('title')
        .isLength({ min: 1 })
        .withMessage('Card title is required')
        .trim()
        .escape(),
    body('description')
        .optional()
        .trim()
        .escape(),
    body('list')
        .isMongoId()
        .withMessage('Valid list ID is required')
];

const moveCardValidation = [
    body('sourceListId')
        .isMongoId()
        .withMessage('Valid source list ID is required'),
    body('targetListId')
        .isMongoId()
        .withMessage('Valid target list ID is required'),
    body('newPosition')
        .isInt({ min: 0 })
        .withMessage('New position must be a non-negative integer')
];

const commentValidation = [
    body('text')
        .isLength({ min: 1 })
        .withMessage('Comment text is required')
        .trim()
        .escape()
];

// Routes
router.post('/', cardValidation, createCard);
router.get('/list/:listId', getCards);
router.put('/:id', cardValidation, updateCard);
router.delete('/:id', deleteCard);
router.put('/:id/move', moveCardValidation, moveCard);
router.post('/:id/comments', commentValidation, addComment);
router.get('/search/:boardId', searchCards);

module.exports = router;



