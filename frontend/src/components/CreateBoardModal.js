import React, { useState, useEffect } from 'react';
import { FiX, FiEdit3, FiPlus } from 'react-icons/fi';
import './Modal.css';

const CreateBoardModal = ({ onClose, onSubmit, editingBoard }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);

    // Debug logging
    console.log('CreateBoardModal rendered with props:', { onClose, onSubmit, editingBoard });

    useEffect(() => {
        if (editingBoard) {
            setFormData({
                title: editingBoard.title || '',
                description: editingBoard.description || ''
            });
        }
    }, [editingBoard]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        setLoading(true);
        try {
            await onSubmit(formData);
        } finally {
            setLoading(false);
        }
    };

    const isEditing = !!editingBoard;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isEditing ? (
                            <>
                                <FiEdit3 />
                                Edit Board
                            </>
                        ) : (
                            <>
                                <FiPlus />
                                Create New Board
                            </>
                        )}
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label className="form-label">Board Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Enter board title"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Enter board description (optional)"
                            rows="3"
                        />
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : (isEditing ? 'Update Board' : 'Create Board')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBoardModal;
