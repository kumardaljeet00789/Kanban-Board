import React, { useState } from 'react';
import { FiX, FiList } from 'react-icons/fi';
import './Modal.css';

const CreateListModal = ({ onClose, onSubmit, boardId }) => {
    const [formData, setFormData] = useState({
        title: ''
    });
    const [loading, setLoading] = useState(false);

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
            await onSubmit({ ...formData, board: boardId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <FiList />
                        Create New List
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label className="form-label">List Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Enter list title"
                            required
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
                            disabled={loading || !formData.title.trim()}
                        >
                            {loading ? 'Creating...' : 'Create List'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateListModal;
