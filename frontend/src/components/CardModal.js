import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiX, FiEdit3, FiTrash2, FiMessageSquare, FiUser } from 'react-icons/fi';

const CardModal = ({ card, onClose, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        title: card.title,
        description: card.description || '',
        priority: card.priority || 'medium'
    });
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await axios.put(`/api/cards/${card._id}`, formData);
            onUpdate(response.data);
            setIsEditing(false);
            toast.success('Card updated successfully!');
        } catch (error) {
            toast.error('Failed to update card');
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        setLoading(true);
        try {
            const response = await axios.post(`/api/cards/${card._id}/comments`, {
                text: newComment
            });
            onUpdate(response.data);
            setNewComment('');
            toast.success('Comment added successfully!');
        } catch (error) {
            toast.error('Failed to add comment');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this card?')) {
            onDelete(card._id);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isEditing ? 'Edit Card' : card.title}
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <div className="modal-content">
                    {isEditing ? (
                        <div>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="form-input"
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
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Priority</label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className="form-input"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                justifyContent: 'flex-end',
                                marginTop: '24px'
                            }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setIsEditing(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleSave}
                                    disabled={loading || !formData.title.trim()}
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '16px'
                                }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: '600' }}>
                                        {card.title}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => setIsEditing(true)}
                                            style={{ padding: '6px 8px' }}
                                        >
                                            <FiEdit3 />
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={handleDelete}
                                            style={{ padding: '6px 8px' }}
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>

                                {card.description && (
                                    <p style={{
                                        color: '#666',
                                        lineHeight: '1.6',
                                        marginBottom: '16px'
                                    }}>
                                        {card.description}
                                    </p>
                                )}

                                <div style={{
                                    display: 'flex',
                                    gap: '16px',
                                    fontSize: '14px',
                                    color: '#888'
                                }}>
                                    <span>Priority: <strong>{card.priority}</strong></span>
                                    {card.assignees && card.assignees.length > 0 && (
                                        <span>
                                            <FiUser style={{ marginRight: '4px' }} />
                                            Assigned to: <strong>{card.assignees[0].username}</strong>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ marginBottom: '12px', color: '#333' }}>
                                    <FiMessageSquare style={{ marginRight: '8px' }} />
                                    Comments
                                </h4>

                                <div style={{ marginBottom: '16px' }}>
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className="form-input"
                                        placeholder="Add a comment..."
                                        rows="2"
                                    />
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleAddComment}
                                        disabled={loading || !newComment.trim()}
                                        style={{ marginTop: '8px' }}
                                    >
                                        {loading ? 'Adding...' : 'Add Comment'}
                                    </button>
                                </div>

                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {card.comments && card.comments.length > 0 ? (
                                        card.comments.map((comment, index) => (
                                            <div key={index} style={{
                                                padding: '12px',
                                                border: '1px solid #e9ecef',
                                                borderRadius: '6px',
                                                marginBottom: '8px',
                                                backgroundColor: '#f8f9fa'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    marginBottom: '8px'
                                                }}>
                                                    <strong>{comment.user?.username || 'Unknown'}</strong>
                                                    <small style={{ color: '#888' }}>
                                                        {new Date(comment.createdAt).toLocaleDateString()}
                                                    </small>
                                                </div>
                                                <p style={{ margin: 0, color: '#333' }}>
                                                    {comment.text}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ color: '#888', fontStyle: 'italic' }}>
                                            No comments yet. Be the first to comment!
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CardModal;
