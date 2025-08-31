const { validationResult } = require('express-validator');
const {
    performSearch,
    getSearchSuggestions,
    getSearchHistory,
    saveSearch,
    getSavedSearches,
    deleteSearch
} = require('../services/searchService');

// Perform search
const search = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const userId = req.user._id;
        const {
            query,
            filters = {},
            sortBy = 'relevance',
            sortOrder = 'desc',
            page = 1,
            limit = 20
        } = req.body;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const result = await performSearch(
            userId,
            query.trim(),
            filters,
            sortBy,
            sortOrder,
            parseInt(page),
            parseInt(limit)
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Search failed'
        });
    }
};

// Get search suggestions
const getSuggestions = async (req, res) => {
    try {
        const userId = req.user._id;
        const { query, limit = 10 } = req.query;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Query parameter is required'
            });
        }

        const suggestions = await getSearchSuggestions(
            userId,
            query.trim(),
            parseInt(limit)
        );

        res.status(200).json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        console.error('Get suggestions error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get suggestions'
        });
    }
};

// Get search history
const getHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20 } = req.query;

        const result = await getSearchHistory(
            userId,
            parseInt(page),
            parseInt(limit)
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get search history error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get search history'
        });
    }
};

// Save search
const saveSearchById = async (req, res) => {
    try {
        const userId = req.user._id;
        const { searchId } = req.params;

        const search = await saveSearch(searchId, userId);

        res.status(200).json({
            success: true,
            message: 'Search saved successfully',
            data: search
        });
    } catch (error) {
        console.error('Save search error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to save search'
        });
    }
};

// Get saved searches
const getSavedSearchesList = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20 } = req.query;

        const result = await getSavedSearches(
            userId,
            parseInt(page),
            parseInt(limit)
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get saved searches error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get saved searches'
        });
    }
};

// Delete search
const deleteSearchById = async (req, res) => {
    try {
        const userId = req.user._id;
        const { searchId } = req.params;

        const result = await deleteSearch(searchId, userId);

        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Delete search error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to delete search'
        });
    }
};

// Get search statistics
const getSearchStats = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get recent searches for statistics
        const { searches } = await getSearchHistory(userId, 1, 1000);

        // Calculate statistics
        const total = searches.length;
        const saved = searches.filter(s => s.isSaved).length;
        const recent = searches.filter(s => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return new Date(s.createdAt) > sevenDaysAgo;
        }).length;

        // Average search time
        const avgSearchTime = searches.length > 0
            ? searches.reduce((sum, s) => sum + (s.searchTime || 0), 0) / searches.length
            : 0;

        // Most common queries
        const queryCounts = searches.reduce((acc, search) => {
            acc[search.query] = (acc[search.query] || 0) + 1;
            return acc;
        }, {});

        const topQueries = Object.entries(queryCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([query, count]) => ({ query, count }));

        res.status(200).json({
            success: true,
            data: {
                total,
                saved,
                recent,
                avgSearchTime: Math.round(avgSearchTime),
                topQueries
            }
        });
    } catch (error) {
        console.error('Get search stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get search statistics'
        });
    }
};

module.exports = {
    search,
    getSuggestions,
    getHistory,
    saveSearchById,
    getSavedSearchesList,
    deleteSearchById,
    getSearchStats
};
