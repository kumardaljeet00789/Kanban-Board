import React, { useState } from 'react';
import { FiX, FiCreditCard, FiFlag } from 'react-icons/fi';
import './Modal.css';

const CreateCardModal = ({ onClose, onSubmit, listId }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium'
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
            await onSubmit({ ...formData, list: listId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <FiCreditCard />
                        Create New Card
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label className="form-label">Card Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Enter card title"
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
                            placeholder="Enter card description (optional)"
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <FiFlag style={{ marginRight: '8px', display: 'inline' }} />
                            Priority
                        </label>
                        <select
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="form-input"
                        >
                            <option value="low">🟢 Low Priority</option>
                            <option value="medium">🟡 Medium Priority</option>
                            <option value="high">🔴 High Priority</option>
                        </select>
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
                            {loading ? 'Creating...' : 'Create Card'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCardModal;
