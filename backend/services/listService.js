const List = require('../models/List');
const Card = require('../models/Card');
const Board = require('../models/Board');

const createList = async (listData, userId) => {
    try {
        // Check if user has access to the board
        const board = await Board.findOne({
            _id: listData.board,
            $or: [
                { owner: userId },
                { members: userId },
                { isPublic: true }
            ]
        });

        if (!board) {
            throw new Error('Board not found or access denied');
        }

        // Get the highest position in the board
        const lastList = await List.findOne({ board: listData.board })
            .sort({ position: -1 });

        const position = lastList ? lastList.position + 1 : 0;

        const list = new List({
            ...listData,
            position
        });

        await list.save();
        return list;
    } catch (error) {
        throw error;
    }
};

const getLists = async (boardId, userId) => {
    try {
        // Check if user has access to the board
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

        return lists;
    } catch (error) {
        throw error;
    }
};

const updateList = async (listId, updateData, userId) => {
    try {
        // Check if user has access to the board
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

        const updatedList = await List.findByIdAndUpdate(
            listId,
            updateData,
            { new: true, runValidators: true }
        );

        return updatedList;
    } catch (error) {
        throw error;
    }
};

const deleteList = async (listId, userId) => {
    try {
        // Check if user has access to the board
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

        // Delete associated cards
        await Card.deleteMany({ list: listId });

        // Delete the list
        await List.findByIdAndDelete(listId);

        // Reorder remaining lists
        await reorderLists(list.board);

        return list;
    } catch (error) {
        throw error;
    }
};

const reorderLists = async (boardId) => {
    try {
        const lists = await List.find({ board: boardId }).sort({ position: 1 });

        for (let i = 0; i < lists.length; i++) {
            await List.findByIdAndUpdate(lists[i]._id, { position: i });
        }
    } catch (error) {
        throw error;
    }
};

const moveList = async (listId, newPosition, userId) => {
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

        const lists = await List.find({ board: list.board }).sort({ position: 1 });

        // Remove the list from its current position
        lists.splice(list.position, 1);

        // Insert at new position
        lists.splice(newPosition, 0, list);

        // Update positions
        for (let i = 0; i < lists.length; i++) {
            await List.findByIdAndUpdate(lists[i]._id, { position: i });
        }

        return await List.findById(listId);
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createList,
    getLists,
    updateList,
    deleteList,
    reorderLists,
    moveList
};
