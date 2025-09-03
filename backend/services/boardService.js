const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');

const createBoard = async (boardData, userId) => {
    try {
        console.log("Creating board for user:", userId);
        const board = new Board({
            ...boardData,
            owner: userId,
            members: []
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
                { 'members.user': userId },
                { isPublic: true }
            ]
        }).populate('owner', 'username avatar');

        // Get lists and cards count for each board
        const boardsWithCounts = await Promise.all(
            boards.map(async (board) => {
                const lists = await List.find({ board: board._id });
                const cards = await Card.find({ board: board._id });
                
                return {
                    ...board.toObject(),
                    lists: lists.map(list => ({
                        _id: list._id,
                        title: list.title,
                        position: list.position,
                        cards: [] // Empty array for dashboard, we only need the count
                    })),
                    listsCount: lists.length,
                    cardsCount: cards.length
                };
            })
        );

        return boardsWithCounts;
    } catch (error) {
        throw error;
    }
};

const getBoardById = async (boardId, userId) => {
    try {
        console.log('Searching for board:', boardId, 'for user:', userId);
        const board = await Board.findOne({
            _id: boardId,
            $or: [
                { owner: userId },
                { 'members.user': userId },
                { isPublic: true }
            ]
        }).populate('owner', 'username avatar')
            .populate('members.user', 'username avatar');
        
        console.log('Board query result:', board ? 'FOUND' : 'NOT FOUND');

        if (!board) {
            throw new Error('Board not found or access denied');
        }

        // Get lists
        const lists = await List.find({ board: boardId })
            .sort({ position: 1 });

        // Get cards for each list
        const listsWithCards = await Promise.all(
            lists.map(async (list) => {
                const cards = await Card.find({ list: list._id })
                    .sort({ position: 1 })
                    .populate('assignees', 'username avatar')
                    .populate('comments.user', 'username avatar');
                
                return {
                    ...list.toObject(),
                    cards
                };
            })
        );

        return { board, lists: listsWithCards };
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
            { $addToSet: { members: { user: memberId, role: 'viewer' } } },
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
            { $pull: { members: { user: memberId } } },
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
