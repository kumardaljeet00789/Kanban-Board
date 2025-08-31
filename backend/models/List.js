const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true
    },
    position: {
        type: Number,
        required: true,
        default: 0
    },
    color: {
        type: String,
        default: '#6c757d'
    }
}, {
    timestamps: true
});

// Ensure unique position within board
listSchema.index({ board: 1, position: 1 }, { unique: true });

module.exports = mongoose.model('List', listSchema);
