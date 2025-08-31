const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    query: {
        type: String,
        required: true,
        trim: true
    },
    filters: {
        boards: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Board'
        }],
        lists: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'List'
        }],
        assignees: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        labels: [String],
        priorities: [String],
        dueDate: {
            start: Date,
            end: Date
        },
        status: {
            type: String,
            enum: ['all', 'open', 'completed', 'overdue'],
            default: 'all'
        },
        hasAttachments: Boolean,
        hasComments: Boolean,
        hasChecklists: Boolean
    },
    sortBy: {
        type: String,
        enum: ['relevance', 'title', 'createdAt', 'updatedAt', 'dueDate', 'priority'],
        default: 'relevance'
    },
    sortOrder: {
        type: String,
        enum: ['asc', 'desc'],
        default: 'desc'
    },
    results: {
        boards: [{
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Board'
            },
            title: String,
            description: String,
            relevance: Number,
            matchType: String
        }],
        lists: [{
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'List'
            },
            title: String,
            board: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Board'
            },
            relevance: Number,
            matchType: String
        }],
        cards: [{
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Card'
            },
            title: String,
            description: String,
            list: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'List'
            },
            board: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Board'
            },
            assignees: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }],
            labels: [String],
            priority: String,
            dueDate: Date,
            relevance: Number,
            matchType: String,
            highlights: [String]
        }],
        totalResults: {
            type: Number,
            default: 0
        }
    },
    searchTime: Number, // in milliseconds
    isSaved: {
        type: Boolean,
        default: false
    },
    savedAt: Date
}, {
    timestamps: true
});

// Indexes for better performance
searchSchema.index({ user: 1, createdAt: -1 });
searchSchema.index({ query: 'text' });
searchSchema.index({ 'filters.boards': 1 });
searchSchema.index({ 'filters.assignees': 1 });
searchSchema.index({ 'filters.labels': 1 });
searchSchema.index({ 'filters.priorities': 1 });
searchSchema.index({ isSaved: 1 });

// Virtual for formatted search time
searchSchema.virtual('formattedSearchTime').get(function () {
    if (!this.searchTime) return null;

    if (this.searchTime < 1000) {
        return `${this.searchTime}ms`;
    } else {
        return `${(this.searchTime / 1000).toFixed(2)}s`;
    }
});

// Virtual for has results
searchSchema.virtual('hasResults').get(function () {
    return this.results.totalResults > 0;
});

// Method to update results count
searchSchema.methods.updateResultsCount = function () {
    const totalResults =
        (this.results.boards ? this.results.boards.length : 0) +
        (this.results.lists ? this.results.lists.length : 0) +
        (this.results.cards ? this.results.cards.length : 0);

    this.results.totalResults = totalResults;
    return this;
};

// Method to save search
searchSchema.methods.saveSearch = function () {
    this.isSaved = true;
    this.savedAt = new Date();
    return this;
};

// Method to unsave search
searchSchema.methods.unsaveSearch = function () {
    this.isSaved = false;
    this.savedAt = undefined;
    return this;
};

// Static method to perform search
searchSchema.statics.performSearch = async function (userId, query, filters = {}, sortBy = 'relevance', sortOrder = 'desc') {
    const startTime = Date.now();

    // Build search query
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
                $gte: filters.dueDate.start,
                $lte: filters.dueDate.end
            };
        } else if (filters.dueDate.start) {
            searchQuery.dueDate = { $gte: filters.dueDate.start };
        } else if (filters.dueDate.end) {
            searchQuery.dueDate = { $lte: filters.dueDate.end };
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

    // Build sort object
    let sortObject = {};
    if (sortBy === 'relevance') {
        // Relevance scoring based on text match and recency
        sortObject = { score: { $meta: 'textScore' }, updatedAt: -1 };
    } else {
        sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    // Perform search
    const cards = await mongoose.model('Card').find(searchQuery)
        .populate('list', 'title')
        .populate('board', 'title')
        .populate('assignees', 'profile.firstName profile.lastName')
        .sort(sortObject)
        .limit(100);

    const lists = await mongoose.model('List').find({
        $or: [
            { title: { $regex: query, $options: 'i' } }
        ],
        ...(filters.boards && filters.boards.length > 0 ? { board: { $in: filters.boards } } : {})
    })
        .populate('board', 'title')
        .limit(50);

    const boards = await mongoose.model('Board').find({
        $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ]
    })
        .limit(20);

    // Calculate relevance scores and prepare results
    const processedCards = cards.map(card => ({
        id: card._id,
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
        highlights: generateHighlights(card, query)
    }));

    const processedLists = lists.map(list => ({
        id: list._id,
        title: list.title,
        board: list.board,
        relevance: calculateRelevance(list, query),
        matchType: determineMatchType(list, query)
    }));

    const processedBoards = boards.map(board => ({
        id: board._id,
        title: board.title,
        description: board.description,
        relevance: calculateRelevance(board, query),
        matchType: determineMatchType(board, query)
    }));

    const searchTime = Date.now() - startTime;

    return {
        cards: processedCards,
        lists: processedLists,
        boards: processedBoards,
        totalResults: processedCards.length + processedLists.length + processedBoards.length,
        searchTime
    };
};

// Helper function to calculate relevance score
function calculateRelevance(item, query) {
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
}

// Helper function to determine match type
function determineMatchType(item, query) {
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
}

// Helper function to generate highlights
function generateHighlights(item, query) {
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
}

// Ensure virtual fields are serialized
searchSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Search', searchSchema);
