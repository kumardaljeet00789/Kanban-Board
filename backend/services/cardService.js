const Card = require('../models/Card');
const List = require('../models/List');
const Board = require('../models/Board');

const createCard = async (cardData, userId) => {
    try {
        // Check if user has access to the list/board
        const list = await List.findById(cardData.list);
        if (!list) {
            throw new Error('List not found');
        }

        const board = await Board.findOne({
            _id: list.board,
            $or: [
                { owner: userId },
                { members: userId },
                { isPublic: true }
            ]
        });

        if (!board) {
            throw new Error('Board not found or access denied');
        }

        // Get the highest position in the list
        const lastCard = await Card.findOne({ list: cardData.list })
            .sort({ position: -1 });

        const position = lastCard ? lastCard.position + 1 : 0;

        const card = new Card({
            ...cardData,
            board: list.board,
            position
        });

        await card.save();

        // Populate the card with user data
        await card.populate([
            { path: 'assignee', select: 'username avatar' },
            { path: 'comments.user', select: 'username avatar' }
        ]);

        return card;
    } catch (error) {
        throw error;
    }
};

const getCards = async (listId, userId) => {
    try {
        const list = await List.findById(listId);
        if (!list) {
            throw new Error('List not found');
        }

        const board = await Board.findOne({
            _id: list.board,
            $or: [
                { owner: userId },
                { members: userId },
                { isPublic: true }
            ]
        });

        if (!board) {
            throw new Error('Board not found or access denied');
        }

        const cards = await Card.find({ list: listId })
            .sort({ position: 1 })
            .populate('assignee', 'username avatar')
            .populate('comments.user', 'username avatar');

        return cards;
    } catch (error) {
        throw error;
    }
};

const updateCard = async (cardId, updateData, userId) => {
    try {
        const card = await Card.findById(cardId);
        if (!card) {
            throw new Error('Card not found');
        }

        const board = await Board.findOne({
            _id: card.board,
            $or: [
                { owner: userId },
                { members: userId },
                { isPublic: true }
            ]
        });

        if (!board) {
            throw new Error('Board not found or access denied');
        }

        const updatedCard = await Card.findByIdAndUpdate(
            cardId,
            updateData,
            { new: true, runValidators: true }
        ).populate([
            { path: 'assignee', select: 'username avatar' },
            { path: 'comments.user', select: 'username avatar' }
        ]);

        return updatedCard;
    } catch (error) {
        throw error;
    }
};

const deleteCard = async (cardId, userId) => {
    try {
        const card = await Card.findById(cardId);
        if (!card) {
            throw new Error('Card not found');
        }

        const board = await Board.findOne({
            _id: card.board,
            $or: [
                { owner: userId },
                { members: userId },
                { isPublic: true }
            ]
        });

        if (!board) {
            throw new Error('Board not found or access denied');
        }

        await Card.findByIdAndDelete(cardId);

        // Reorder remaining cards in the list
        await reorderCards(card.list);

        return card;
    } catch (error) {
        throw error;
    }
};

const moveCard = async (cardId, sourceListId, targetListId, newPosition, userId) => {
    try {
        const card = await Card.findById(cardId);
        if (!card) {
            throw new Error('Card not found');
        }

        // Check access to both lists
        const sourceList = await List.findById(sourceListId);
        const targetList = await List.findById(targetListId);

        if (!sourceList || !targetList) {
            throw new Error('List not found');
        }

        const board = await Board.findOne({
            _id: card.board,
            $or: [
                { owner: userId },
                { members: userId },
                { isPublic: true }
            ]
        });

        if (!board) {
            throw new Error('Board not found or access denied');
        }

        // Update card position and list
        card.list = targetListId;
        card.position = newPosition;
        await card.save();

        // Reorder cards in both lists
        await reorderCards(sourceListId);
        await reorderCards(targetListId);

        // Populate the card with user data
        await card.populate([
            { path: 'assignee', select: 'username avatar' },
            { path: 'comments.user', select: 'username avatar' }
        ]);

        return card;
    } catch (error) {
        throw error;
    }
};

const reorderCards = async (listId) => {
    try {
        const cards = await Card.find({ list: listId }).sort({ position: 1 });

        for (let i = 0; i < cards.length; i++) {
            await Card.findByIdAndUpdate(cards[i]._id, { position: i });
        }
    } catch (error) {
        throw error;
    }
};

const addComment = async (cardId, commentData, userId) => {
    try {
        const card = await Card.findById(cardId);
        if (!card) {
            throw new Error('Card not found');
        }

        const board = await Board.findOne({
            _id: card.board,
            $or: [
                { owner: userId },
                { members: userId },
                { isPublic: true }
            ]
        });

        if (!board) {
            throw new Error('Board not found or access denied');
        }

        card.comments.push({
            user: userId,
            text: commentData.text
        });

        await card.save();

        // Populate the card with user data
        await card.populate([
            { path: 'assignee', select: 'username avatar' },
            { path: 'comments.user', select: 'username avatar' }
        ]);

        return card;
    } catch (error) {
        throw error;
    }
};

const searchCards = async (query, boardId, userId) => {
    try {
        const board = await Board.findOne({
            _id: boardId,
            $or: [
                { owner: userId },
                { members: userId },
                { isPublic: true }
            ]
        });

        if (!board) {
            throw new Error('Board not found or access denied');
        }

        const cards = await Card.find({
            board: boardId,
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        }).populate([
            { path: 'assignee', select: 'username avatar' },
            { path: 'list', select: 'title' }
        ]);

        return cards;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createCard,
    getCards,
    updateCard,
    deleteCard,
    moveCard,
    reorderCards,
    addComment,
    searchCards
};
