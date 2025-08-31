const Search = require('../models/Search');
const Card = require('../models/Card');
const List = require('../models/List');
const Board = require('../models/Board');
const User = require('../models/User');

// Perform search
const performSearch = async (userId, query, filters = {}, sortBy = 'relevance', sortOrder = 'desc', page = 1, limit = 20) => {
    try {
        const startTime = Date.now();
        
        // Build search query for cards
        const cardQuery = buildCardSearchQuery(query, filters);
        
        // Build search query for lists
        const listQuery = buildListSearchQuery(query, filters);
        
        // Build search query for boards
        const boardQuery = buildBoardSearchQuery(query, filters);
        
        // Execute searches in parallel
        const [cards, lists, boards] = await Promise.all([
            searchCards(cardQuery, sortBy, sortOrder, page, limit),
            searchLists(listQuery, sortBy, sortOrder, page, limit),
            searchBoards(boardQuery, sortBy, sortOrder, page, limit)
        ]);
        
        // Calculate relevance scores and prepare results
        const processedCards = processCardResults(cards, query);
        const processedLists = processListResults(lists, query);
        const processedBoards = processBoardResults(boards, query);
        
        // Combine and sort results by relevance
        const allResults = [...processedCards, ...processedLists, ...processedBoards];
        allResults.sort((a, b) => b.relevance - a.relevance);
        
        // Apply pagination to combined results
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedResults = allResults.slice(startIndex, endIndex);
        
        const searchTime = Date.now() - startTime;
        
        // Save search to database
        const searchRecord = new Search({
            user: userId,
            query,
            filters,
            sortBy,
            sortOrder,
            results: {
                boards: processedBoards.slice(0, 20),
                lists: processedLists.slice(0, 50),
                cards: processedCards.slice(0, 100),
                totalResults: allResults.length
            },
            searchTime
        });
        
        await searchRecord.save();
        
        return {
            results: paginatedResults,
            pagination: {
                page,
                limit,
                total: allResults.length,
                pages: Math.ceil(allResults.length / limit)
            },
            searchTime,
            searchId: searchRecord._id
        };
        
    } catch (error) {
        console.error('Error performing search:', error);
        throw error;
    }
};

// Build card search query
const buildCardSearchQuery = (query, filters) => {
    const searchQuery = {
        $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { tags: { $in: [new RegExp(query, 'i')] } }
        ]
    };
    
    // Apply filters
    if (filters.boards && filters.boards.length > 0) {
        searchQuery.board = { $in: filters.boards };
    }
    
    if (filters.lists && filters.lists.length > 0) {
        searchQuery.list = { $in: filters.lists };
    }
    
    if (filters.assignees && filters.assignees.length > 0) {
        searchQuery.assignees = { $in: filters.assignees };
    }
    
    if (filters.labels && filters.labels.length > 0) {
        searchQuery['labels.name'] = { $in: filters.labels };
    }
    
    if (filters.priorities && filters.priorities.length > 0) {
        searchQuery.priority = { $in: filters.priorities };
    }
    
    if (filters.dueDate) {
        if (filters.dueDate.start && filters.dueDate.end) {
            searchQuery.dueDate = {
                $gte: new Date(filters.dueDate.start),
                $lte: new Date(filters.dueDate.end)
            };
        } else if (filters.dueDate.start) {
            searchQuery.dueDate = { $gte: new Date(filters.dueDate.start) };
        } else if (filters.dueDate.end) {
            searchQuery.dueDate = { $lte: new Date(filters.dueDate.end) };
        }
    }
    
    if (filters.status && filters.status !== 'all') {
        if (filters.status === 'completed') {
            searchQuery.isCompleted = true;
        } else if (filters.status === 'open') {
            searchQuery.isCompleted = false;
        } else if (filters.status === 'overdue') {
            searchQuery.dueDate = { $lt: new Date() };
            searchQuery.isCompleted = false;
        }
    }
    
    if (filters.hasAttachments !== undefined) {
        if (filters.hasAttachments) {
            searchQuery['attachments.0'] = { $exists: true };
        } else {
            searchQuery['attachments.0'] = { $exists: false };
        }
    }
    
    if (filters.hasComments !== undefined) {
        if (filters.hasComments) {
            searchQuery['comments.0'] = { $exists: true };
        } else {
            searchQuery['comments.0'] = { $exists: false };
        }
    }
    
    if (filters.hasChecklists !== undefined) {
        if (filters.hasChecklists) {
            searchQuery['checklists.0'] = { $exists: true };
        } else {
            searchQuery['checklists.0'] = { $exists: false };
        }
    }
    
    return searchQuery;
};

// Build list search query
const buildListSearchQuery = (query, filters) => {
    const searchQuery = {
        $or: [
            { title: { $regex: query, $options: 'i' } }
        ]
    };
    
    if (filters.boards && filters.boards.length > 0) {
        searchQuery.board = { $in: filters.boards };
    }
    
    return searchQuery;
};

// Build board search query
const buildBoardSearchQuery = (query, filters) => {
    const searchQuery = {
        $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ]
    };
    
    return searchQuery;
};

// Search cards
const searchCards = async (query, sortBy, sortOrder, page, limit) => {
    const skip = (page - 1) * limit;
    
    let sortObject = {};
    if (sortBy === 'relevance') {
        sortObject = { updatedAt: -1 };
    } else {
        sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }
    
    return await Card.find(query)
        .populate('list', 'title')
        .populate('board', 'title')
        .populate('assignees', 'username profile.firstName profile.lastName profile.avatar')
        .sort(sortObject)
        .skip(skip)
        .limit(limit);
};

// Search lists
const searchLists = async (query, sortBy, sortOrder, page, limit) => {
    const skip = (page - 1) * limit;
    
    let sortObject = {};
    if (sortBy === 'relevance') {
        sortObject = { updatedAt: -1 };
    } else {
        sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }
    
    return await List.find(query)
        .populate('board', 'title')
        .sort(sortObject)
        .skip(skip)
        .limit(limit);
};

// Search boards
const searchBoards = async (query, sortBy, sortOrder, page, limit) => {
    const skip = (page - 1) * limit;
    
    let sortObject = {};
    if (sortBy === 'relevance') {
        sortObject = { updatedAt: -1 };
    } else {
        sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }
    
    return await Board.find(query)
        .sort(sortObject)
        .skip(skip)
        .limit(limit);
};

// Process card results
const processCardResults = (cards, query) => {
    return cards.map(card => ({
        id: card._id,
        type: 'card',
        title: card.title,
        description: card.description,
        list: card.list,
        board: card.board,
        assignees: card.assignees,
        labels: card.labels.map(l => l.name),
        priority: card.priority,
        dueDate: card.dueDate,
        relevance: calculateRelevance(card, query),
        matchType: determineMatchType(card, query),
        highlights: generateHighlights(card, query),
        url: `/board/${card.board._id}/card/${card._id}`
    }));
};

// Process list results
const processListResults = (lists, query) => {
    return lists.map(list => ({
        id: list._id,
        type: 'list',
        title: list.title,
        board: list.board,
        relevance: calculateRelevance(list, query),
        matchType: determineMatchType(list, query),
        url: `/board/${list.board._id}`
    }));
};

// Process board results
const processBoardResults = (boards, query) => {
    return boards.map(board => ({
        id: board._id,
        type: 'board',
        title: board.title,
        description: board.description,
        relevance: calculateRelevance(board, query),
        matchType: determineMatchType(board, query),
        url: `/board/${board._id}`
    }));
};

// Calculate relevance score
const calculateRelevance = (item, query) => {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Title match (highest weight)
    if (item.title && item.title.toLowerCase().includes(queryLower)) {
        score += 100;
        if (item.title.toLowerCase().startsWith(queryLower)) {
            score += 50; // Bonus for starting with query
        }
    }
    
    // Description match
    if (item.description && item.description.toLowerCase().includes(queryLower)) {
        score += 30;
    }
    
    // Tags match
    if (item.tags) {
        item.tags.forEach(tag => {
            if (tag.toLowerCase().includes(queryLower)) {
                score += 20;
            }
        });
    }
    
    // Labels match
    if (item.labels) {
        item.labels.forEach(label => {
            if (label.name && label.name.toLowerCase().includes(queryLower)) {
                score += 25;
            }
        });
    }
    
    // Recency bonus
    if (item.updatedAt) {
        const daysSinceUpdate = (Date.now() - item.updatedAt) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 1) score += 10;
        else if (daysSinceUpdate < 7) score += 5;
    }
    
    return score;
};

// Determine match type
const determineMatchType = (item, query) => {
    const queryLower = query.toLowerCase();
    
    if (item.title && item.title.toLowerCase().startsWith(queryLower)) {
        return 'title_starts_with';
    } else if (item.title && item.title.toLowerCase().includes(queryLower)) {
        return 'title_contains';
    } else if (item.description && item.description.toLowerCase().includes(queryLower)) {
        return 'description_contains';
    } else if (item.tags && item.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
        return 'tag_match';
    } else if (item.labels && item.labels.some(label => label.name && label.name.toLowerCase().includes(queryLower))) {
        return 'label_match';
    }
    
    return 'partial_match';
};

// Generate highlights
const generateHighlights = (item, query) => {
    const highlights = [];
    const queryLower = query.toLowerCase();
    
    if (item.title && item.title.toLowerCase().includes(queryLower)) {
        highlights.push(`Title: ${item.title}`);
    }
    
    if (item.description && item.description.toLowerCase().includes(queryLower)) {
        const desc = item.description.length > 100 
            ? item.description.substring(0, 100) + '...' 
            : item.description;
        highlights.push(`Description: ${desc}`);
    }
    
    if (item.tags) {
        const matchingTags = item.tags.filter(tag => 
            tag.toLowerCase().includes(queryLower)
        );
        if (matchingTags.length > 0) {
            highlights.push(`Tags: ${matchingTags.join(', ')}`);
        }
    }
    
    return highlights;
};

// Get search suggestions
const getSearchSuggestions = async (userId, query, limit = 10) => {
    try {
        // Get recent searches
        const recentSearches = await Search.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('query');
        
        // Get popular searches (could be enhanced with analytics)
        const popularSearches = await Search.aggregate([
            { $group: { _id: '$query', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        
        // Get card suggestions
        const cardSuggestions = await Card.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { tags: { $in: [new RegExp(query, 'i')] } }
            ]
        })
        .select('title tags')
        .limit(limit);
        
        // Get label suggestions
        const labelSuggestions = await Card.aggregate([
            { $unwind: '$labels' },
            { $match: { 'labels.name': { $regex: query, $options: 'i' } } },
            { $group: { _id: '$labels.name', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        
        return {
            recentSearches: recentSearches.map(s => s.query),
            popularSearches: popularSearches.map(s => s._id),
            cardSuggestions: cardSuggestions.map(c => ({ title: c.title, tags: c.tags })),
            labelSuggestions: labelSuggestions.map(l => l._id)
        };
        
    } catch (error) {
        console.error('Error getting search suggestions:', error);
        throw error;
    }
};

// Get search history
const getSearchHistory = async (userId, page = 1, limit = 20) => {
    try {
        const skip = (page - 1) * limit;
        
        const searches = await Search.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await Search.countDocuments({ user: userId });
        
        return {
            searches,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
        
    } catch (error) {
        console.error('Error getting search history:', error);
        throw error;
    }
};

// Save search
const saveSearch = async (searchId, userId) => {
    try {
        const search = await Search.findOneAndUpdate(
            { _id: searchId, user: userId },
            { isSaved: true, savedAt: new Date() },
            { new: true }
        );
        
        if (!search) {
            throw new Error('Search not found or access denied');
        }
        
        return search;
        
    } catch (error) {
        console.error('Error saving search:', error);
        throw error;
    }
};

// Get saved searches
const getSavedSearches = async (userId, page = 1, limit = 20) => {
    try {
        const skip = (page - 1) * limit;
        
        const searches = await Search.find({ user: userId, isSaved: true })
            .sort({ savedAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await Search.countDocuments({ user: userId, isSaved: true });
        
        return {
            searches,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
        
    } catch (error) {
        console.error('Error getting saved searches:', error);
        throw error;
    }
};

// Delete search
const deleteSearch = async (searchId, userId) => {
    try {
        const search = await Search.findOneAndDelete({
            _id: searchId,
            user: userId
        });
        
        if (!search) {
            throw new Error('Search not found or access denied');
        }
        
        return { message: 'Search deleted successfully' };
        
    } catch (error) {
        console.error('Error deleting search:', error);
        throw error;
    }
};

module.exports = {
    performSearch,
    getSearchSuggestions,
    getSearchHistory,
    saveSearch,
    getSavedSearches,
    deleteSearch
};
