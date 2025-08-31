const {
    createList: createListService,
    getLists: getListsService,
    updateList: updateListService,
    deleteList: deleteListService,
    moveList: moveListService
} = require('../services/listService');
const { validationResult } = require('express-validator');

const createList = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const list = await createListService(req.body, req.user._id);
        res.status(201).json(list);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getLists = async (req, res) => {
    try {
        const lists = await getListsService(req.params.boardId, req.user._id);
        res.json(lists);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateList = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const list = await updateListService(req.params.id, req.body, req.user._id);
        res.json(list);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteList = async (req, res) => {
    try {
        const list = await deleteListService(req.params.id, req.user._id);
        res.json({ message: 'List deleted successfully', list });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const moveList = async (req, res) => {
    try {
        const list = await moveListService(req.params.id, req.body.newPosition, req.user._id);
        res.json(list);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createList,
    getLists,
    updateList,
    deleteList,
    moveList
};
