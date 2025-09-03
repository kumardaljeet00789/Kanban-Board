import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiPlus, FiEdit3, FiTrash2, FiEye, FiUsers, FiCalendar, FiTag } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import CreateBoardModal from './CreateBoardModal';
import Navbar from './Navbar';
import toast from 'react-hot-toast';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [boards, setBoards] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoards();
  }, []);

  // Refresh boards when user navigates back to dashboard
  useEffect(() => {
    if (location.pathname === '/') {
      fetchBoards();
    }
  }, [location.pathname]);

  const fetchBoards = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/boards`);
      setBoards(response.data || []);
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (boardData) => {
    try {
      console.log('Creating board with data:', boardData);
      console.log('Current token:', localStorage.getItem('token'));
      console.log('Axios default headers:', axios.defaults.headers.common);

      await axios.post(`${process.env.REACT_APP_API_URL}/api/boards`, boardData);
      setShowCreateModal(false);
      toast.success('Board created successfully!');
      // Refresh the boards list
      await fetchBoards();
    } catch (error) {
      console.error('Error creating board:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to create board');
    }
  };

  const handleEditBoard = async (boardData) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/boards/${editingBoard._id}`, boardData);
      setShowCreateModal(false);
      setEditingBoard(null);
      toast.success('Board updated successfully!');
      // Refresh the boards list
      await fetchBoards();
    } catch (error) {
      console.error('Error updating board:', error);
      toast.error(error.response?.data?.message || 'Failed to update board');
    }
  };

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/boards/${boardId}`);
      toast.success('Board deleted successfully!');
      // Refresh the boards list
      await fetchBoards();
    } catch (error) {
      console.error('Error deleting board:', error);
      toast.error(error.response?.data?.message || 'Failed to delete board');
    }
  };

  const startEditing = (board) => {
    setEditingBoard(board);
    setShowCreateModal(true);
  };

  const getBoardStats = (board) => {
    const totalCards = board.lists?.reduce((sum, list) => sum + (list.cards?.length || 0), 0) || 0;
    const completedCards = board.lists?.reduce((sum, list) =>
      sum + (list.cards?.filter(card => card.isCompleted)?.length || 0), 0) || 0;

    return { totalCards, completedCards };
  };

  return (
    <div className="dashboard-container">
      <Navbar />

      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Welcome back, {user?.profile?.firstName || user?.username || 'User'}!</h1>
          <p className="dashboard-subtitle">Manage your boards and track your progress</p>
        </div>
        <div className="dashboard-actions">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <FiPlus />
            Create New Board
          </button>
          {/* Test button to verify modal state */}
          <button
            onClick={() => console.log('Modal state:', showCreateModal)}
            className="btn btn-secondary"
            style={{ marginLeft: '10px' }}
          >
            Debug Modal State
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Total Boards</span>
            </div>
            <div className="stat-card-value">{boards.length}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Total Lists</span>
            </div>
            <div className="stat-card-value">{boards.reduce((total, board) => total + (board.listsCount || 0), 0)}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Total Cards</span>
            </div>
            <div className="stat-card-value">{boards.reduce((total, board) => total + (board.cardsCount || 0), 0)}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Team Members</span>
            </div>
            <div className="stat-card-value">{boards.reduce((total, board) => total + (board.members?.length || 0), 0)}</div>
          </div>
        </div>

        {/* Create Board Button */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ fontSize: '16px', padding: '14px 28px' }}
          >
            <FiPlus style={{ marginRight: '8px' }} />
            Create New Board
          </button>
        </div>

        {/* Boards Section */}
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', marginBottom: '24px' }}>
            Your Boards
          </h2>

          {loading ? (
            <div className="loading" style={{ padding: '60px 20px' }}>
              <div className="loading-spinner"></div>
              Loading your boards...
            </div>
          ) : boards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="empty-state-title">No boards yet</h3>
              <p className="empty-state-description">
                Create your first board to start organizing your tasks and projects.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
                style={{ marginTop: '16px' }}
              >
                <FiPlus style={{ marginRight: '8px' }} />
                Create Your First Board
              </button>
            </div>
          ) : (
            <div className="boards-grid">
              {boards.map((board) => (
                <div key={board._id} className="board-card">
                  <div className="board-card-header">
                    <div>
                      <h3 className="board-card-title">{board.title}</h3>
                      <p className="board-card-description">
                        {board.description || 'No description'}
                      </p>
                    </div>
                    <div className="board-card-actions">
                      <button
                        onClick={() => handleEditBoard(board)}
                        className="btn-icon"
                        title="Edit board"
                      >
                        <FiEdit3 />
                      </button>
                      <button
                        onClick={() => handleDeleteBoard(board._id)}
                        className="btn-icon danger"
                        title="Delete board"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  <div className="board-card-stats">
                    <div className="board-stat">
                      <FiEye />
                      <span>{board.listsCount || 0} lists</span>
                    </div>
                    <div className="board-stat">
                      <FiUsers />
                      <span>{board.members?.length || 1} members</span>
                    </div>
                    <div className="board-stat">
                      <FiCalendar />
                      <span>{new Date(board.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <Link
                      to={`/board/${board._id}`}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Open Board
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Board Modal */}
      {showCreateModal && (
        <CreateBoardModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateBoard}
        />
      )}

      {/* Edit Board Modal */}
      {editingBoard && (
        <CreateBoardModal
          editingBoard={editingBoard}
          onClose={() => setEditingBoard(null)}
          onSubmit={handleEditBoard}
        />
      )}
    </div>
  );
};

export default Dashboard;
