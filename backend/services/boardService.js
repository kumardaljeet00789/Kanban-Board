const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');

const createBoard = async (boardData, userId) => {
    try {
        const board = new Board({
            ...boardData,
            owner: userId,
            members: [userId]
        });
        await board.save();
        return board;
    } catch (error) {
        throw error;
    }
};

const getBoards = async (userId) => {
    try {
        const boards = await Board.find({
            $or: [
                { owner: userId },
                { members: userId },
                { isPublic: true }
            ]
        }).populate('owner', 'username avatar');
        return boards;
    } catch (error) {
        throw error;
    }
};

const getBoardById = async (boardId, userId) => {
    try {
        const board = await Board.findOne({
            _id: boardId,
            $or: [
                { owner: userId },
                { members: userId },
                { isPublic: true }
            ]
        }).populate('owner', 'username avatar')
            .populate('members', 'username avatar');

        if (!board) {
            throw new Error('Board not found or access denied');
        }

        // Get lists with cards
        const lists = await List.find({ board: boardId })
            .sort({ position: 1 })
            .populate({
                path: 'cards',
                model: 'Card',
                populate: [
                    { path: 'assignee', select: 'username avatar' },
                    { path: 'comments.user', select: 'username avatar' }
                ]
            });

        return { board, lists };
    } catch (error) {
        throw error;
    }
};

const updateBoard = async (boardId, updateData, userId) => {
    try {
        const board = await Board.findOneAndUpdate(
            { _id: boardId, owner: userId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!board) {
            throw new Error('Board not found or access denied');
        }

        return board;
    } catch (error) {
        throw error;
    }
};

const deleteBoard = async (boardId, userId) => {
    try {
        const board = await Board.findOneAndDelete({
            _id: boardId,
            owner: userId
        });

        if (!board) {
            throw new Error('Board not found or access denied');
        }

        // Delete associated lists and cards
        await List.deleteMany({ board: boardId });
        await Card.deleteMany({ board: boardId });

        return board;
    } catch (error) {
        throw error;
    }
};

const addMember = async (boardId, memberId, userId) => {
    try {
        const board = await Board.findOneAndUpdate(
            { _id: boardId, owner: userId },
            { $addToSet: { members: memberId } },
            { new: true }
        );

        if (!board) {
            throw new Error('Board not found or access denied');
        }

        return board;
    } catch (error) {
        throw error;
    }
};

const removeMember = async (boardId, memberId, userId) => {
    try {
        const board = await Board.findOneAndUpdate(
            { _id: boardId, owner: userId },
            { $pull: { members: memberId } },
            { new: true }
        );

        if (!board) {
            throw new Error('Board not found or access denied');
        }

        return board;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createBoard,
    getBoards,
    getBoardById,
    updateBoard,
    deleteBoard,
    addMember,
    removeMember
};
