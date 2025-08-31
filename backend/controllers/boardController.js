const {
    createBoard: createBoardService,
    getBoards: getBoardsService,
    getBoardById: getBoardByIdService,
    updateBoard: updateBoardService,
    deleteBoard: deleteBoardService,
    addMember: addMemberService,
    removeMember: removeMemberService
} = require('../services/boardService');
const { validationResult } = require('express-validator');

const createBoard = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const board = await createBoardService(req.body, req.user._id);
        res.status(201).json(board);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getBoards = async (req, res) => {
    try {
        const boards = await getBoardsService(req.user._id);
        res.json(boards);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getBoardById = async (req, res) => {
    try {
        const result = await getBoardByIdService(req.params.id, req.user._id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateBoard = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const board = await updateBoardService(req.params.id, req.body, req.user._id);
        res.json(board);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteBoard = async (req, res) => {
    try {
        const board = await deleteBoardService(req.params.id, req.user._id);
        res.json({ message: 'Board deleted successfully', board });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const addMember = async (req, res) => {
    try {
        const board = await addMemberService(req.params.id, req.body.memberId, req.user._id);
        res.json(board);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const removeMember = async (req, res) => {
    try {
        const board = await removeMemberService(req.params.id, req.params.memberId, req.user._id);
        res.json(board);
    } catch (error) {
        res.status(400).json({ message: error.message });
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
