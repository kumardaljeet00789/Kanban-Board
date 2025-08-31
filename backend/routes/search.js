const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const {
    search,
    getSuggestions,
    getHistory,
    saveSearchById,
    getSavedSearchesList,
    deleteSearchById,
    getSearchStats
} = require('../controllers/searchController');

// Perform search
router.post('/', auth, [
    body('query').trim().isLength({ min: 1 }).withMessage('Search query is required'),
    body('filters.boards').optional().isArray(),
    body('filters.lists').optional().isArray(),
    body('filters.assignees').optional().isArray(),
    body('filters.labels').optional().isArray(),
    body('filters.priorities').optional().isArray(),
    body('filters.dueDate.start').optional().isISO8601(),
    body('filters.dueDate.end').optional().isISO8601(),
    body('filters.status').optional().isIn(['all', 'open', 'completed', 'overdue']),
    body('filters.hasAttachments').optional().isBoolean(),
    body('filters.hasComments').optional().isBoolean(),
    body('filters.hasChecklists').optional().isBoolean(),
    body('sortBy').optional().isIn(['relevance', 'title', 'createdAt', 'updatedAt', 'dueDate', 'priority']),
    body('sortOrder').optional().isIn(['asc', 'desc']),
    body('page').optional().isInt({ min: 1 }),
    body('limit').optional().isInt({ min: 1, max: 100 })
], search);

// Get search suggestions
router.get('/suggestions', auth, getSuggestions);

// Get search history
router.get('/history', auth, getHistory);

// Save search
router.patch('/:searchId/save', auth, saveSearchById);

// Get saved searches
router.get('/saved', auth, getSavedSearchesList);

// Delete search
router.delete('/:searchId', auth, deleteSearchById);

// Get search statistics
router.get('/stats', auth, getSearchStats);

module.exports = router;
