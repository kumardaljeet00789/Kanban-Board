const {
    createCard: createCardService,
    getCards: getCardsService,
    updateCard: updateCardService,
    deleteCard: deleteCardService,
    moveCard: moveCardService,
    addComment: addCommentService,
    searchCards: searchCardsService
} = require('../services/cardService');
const { validationResult } = require('express-validator');

const createCard = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const card = await createCardService(req.body, req.user._id);
        res.status(201).json(card);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getCards = async (req, res) => {
    try {
        const cards = await getCardsService(req.params.listId, req.user._id);
        res.json(cards);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateCard = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const card = await updateCardService(req.params.id, req.body, req.user._id);
        res.json(card);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteCard = async (req, res) => {
    try {
        const card = await deleteCardService(req.params.id, req.user._id);
        res.json({ message: 'Card deleted successfully', card });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const moveCard = async (req, res) => {
    try {
        const card = await moveCardService(
            req.params.id,
            req.body.sourceListId,
            req.body.targetListId,
            req.body.newPosition,
            req.user._id
        );
        res.json(card);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const addComment = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const card = await addCommentService(req.params.id, req.body, req.user._id);
        res.json(card);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const searchCards = async (req, res) => {
    try {
        const cards = await searchCardsService(req.query.q, req.params.boardId, req.user._id);
        res.json(cards);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createCard,
    getCards,
    updateCard,
    deleteCard,
    moveCard,
    addComment,
    searchCards
};



