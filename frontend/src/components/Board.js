import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiPlus, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import CreateListModal from './CreateListModal';
import CreateCardModal from './CreateCardModal';
import CardModal from './CardModal';

const Board = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [board, setBoard] = useState(null);
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateListModal, setShowCreateListModal] = useState(false);
    const [showCreateCardModal, setShowCreateCardModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [selectedListId, setSelectedListId] = useState(null);

    const fetchBoard = useCallback(async () => {
        try {
            const response = await axios.get(`/api/boards/${id}`);
            setBoard(response.data.board);
            setLists(response.data.lists);
        } catch (error) {
            toast.error('Failed to fetch board');
            navigate('/');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchBoard();
    }, [fetchBoard]);

    const handleCreateList = async (listData) => {
        try {
            const response = await axios.post('/api/lists', { ...listData, board: id });
            setLists([...lists, response.data]);
            setShowCreateListModal(false);
            toast.success('List created successfully!');
        } catch (error) {
            toast.error('Failed to create list');
        }
    };

    const handleCreateCard = async (cardData) => {
        try {
            const response = await axios.post('/api/cards', { ...cardData, list: selectedListId });
            const updatedLists = lists.map(list => {
                if (list._id === selectedListId) {
                    return { ...list, cards: [...(list.cards || []), response.data] };
                }
                return list;
            });
            setLists(updatedLists);
            setShowCreateCardModal(false);
            toast.success('Card created successfully!');
        } catch (error) {
            toast.error('Failed to create card');
        }
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const { source, destination, type } = result;

        if (type === 'LIST') {
            // Handle list reordering
            const newLists = Array.from(lists);
            const [removed] = newLists.splice(source.index, 1);
            newLists.splice(destination.index, 0, removed);
            setLists(newLists);

            try {
                await axios.put(`/api/lists/${removed._id}/move`, { newPosition: destination.index });
            } catch (error) {
                toast.error('Failed to move list');
                fetchBoard(); // Refresh to get correct order
            }
        } else if (type === 'CARD') {
            // Handle card movement
            const sourceList = lists.find(list => list._id === source.droppableId);
            const destList = lists.find(list => list._id === destination.droppableId);

            if (!sourceList || !destList) return;

            const sourceCards = Array.from(sourceList.cards || []);
            const destCards = Array.from(destList.cards || []);

            const [movedCard] = sourceCards.splice(source.index, 1);
            destCards.splice(destination.index, 0, movedCard);

            const newLists = lists.map(list => {
                if (list._id === source.droppableId) {
                    return { ...list, cards: sourceCards };
                }
                if (list._id === destination.droppableId) {
                    return { ...list, cards: destCards };
                }
                return list;
            });

            setLists(newLists);

            try {
                await axios.put(`/api/cards/${movedCard._id}/move`, {
                    sourceListId: source.droppableId,
                    targetListId: destination.droppableId,
                    newPosition: destination.index
                });
            } catch (error) {
                toast.error('Failed to move card');
                fetchBoard(); // Refresh to get correct order
            }
        }
    };

    const handleDeleteList = async (listId) => {
        if (window.confirm('Are you sure you want to delete this list?')) {
            try {
                await axios.delete(`/api/lists/${listId}`);
                setLists(lists.filter(list => list._id !== listId));
                toast.success('List deleted successfully!');
            } catch (error) {
                toast.error('Failed to delete list');
            }
        }
    };

    const handleDeleteCard = async (cardId, listId) => {
        if (window.confirm('Are you sure you want to delete this card?')) {
            try {
                await axios.delete(`/api/cards/${cardId}`);
                const updatedLists = lists.map(list => {
                    if (list._id === listId) {
                        return { ...list, cards: list.cards.filter(card => card._id !== cardId) };
                    }
                    return list;
                });
                setLists(updatedLists);
                toast.success('Card deleted successfully!');
            } catch (error) {
                toast.error('Failed to delete card');
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading board...</div>;
    }

    if (!board) {
        return <div className="error">Board not found</div>;
    }

    return (
        <div>
            <div style={{
                background: 'white',
                padding: '20px',
                borderBottom: '1px solid #e9ecef',
                marginBottom: '20px'
            }}>
                <div className="container">
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <button
                                className="btn btn-secondary"
                                onClick={() => navigate('/')}
                                style={{ marginBottom: '10px' }}
                            >
                                <FiArrowLeft /> Back to Dashboard
                            </button>
                            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#333' }}>
                                {board.title}
                            </h1>
                            {board.description && (
                                <p style={{ color: '#666', marginTop: '8px' }}>
                                    {board.description}
                                </p>
                            )}
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowCreateListModal(true)}
                        >
                            <FiPlus /> Add List
                        </button>
                    </div>
                </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="board" type="LIST" direction="horizontal">
                    {(provided) => (
                        <div
                            className="kanban-board"
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {lists.map((list, index) => (
                                <Draggable key={list._id} draggableId={list._id} index={index}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className="kanban-list"
                                        >
                                            <div className="list-header" {...provided.dragHandleProps}>
                                                <h3 className="list-title">{list.title}</h3>
                                                <div className="list-actions">
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => {
                                                            setSelectedListId(list._id);
                                                            setShowCreateCardModal(true);
                                                        }}
                                                        style={{ padding: '4px 8px', fontSize: '12px' }}
                                                    >
                                                        <FiPlus />
                                                    </button>
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={() => handleDeleteList(list._id)}
                                                        style={{ padding: '4px 8px', fontSize: '12px' }}
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </div>

                                            <Droppable droppableId={list._id} type="CARD">
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        style={{ minHeight: '100px' }}
                                                    >
                                                        {(list.cards || []).map((card, index) => (
                                                            <Draggable key={card._id} draggableId={card._id} index={index}>
                                                                {(provided) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        className="kanban-card"
                                                                        data-priority={card.priority || 'medium'}
                                                                        onClick={() => setSelectedCard(card)}
                                                                    >
                                                                        <div className="card-title">{card.title}</div>
                                                                        {card.description && (
                                                                            <div className="card-description">
                                                                                {card.description}
                                                                            </div>
                                                                        )}
                                                                        <div className="card-meta">
                                                                            <span style={{
                                                                                padding: '4px 8px',
                                                                                borderRadius: '12px',
                                                                                fontSize: '11px',
                                                                                fontWeight: '600',
                                                                                textTransform: 'uppercase',
                                                                                backgroundColor: card.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' :
                                                                                    card.priority === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                                                color: card.priority === 'high' ? 'var(--danger-color)' :
                                                                                    card.priority === 'medium' ? 'var(--warning-color)' : 'var(--success-color)'
                                                                            }}>
                                                                                {card.priority || 'medium'}
                                                                            </span>
                                                                            {card.assignee && (
                                                                                <span>@{card.assignee.username}</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {showCreateListModal && (
                <CreateListModal
                    onClose={() => setShowCreateListModal(false)}
                    onSubmit={handleCreateList}
                    boardId={id}
                />
            )}

            {showCreateCardModal && (
                <CreateCardModal
                    onClose={() => setShowCreateCardModal(false)}
                    onSubmit={handleCreateCard}
                    listId={selectedListId}
                />
            )}

            {selectedCard && (
                <CardModal
                    card={selectedCard}
                    onClose={() => setSelectedCard(null)}
                    onUpdate={(updatedCard) => {
                        const updatedLists = lists.map(list => ({
                            ...list,
                            cards: list.cards.map(card =>
                                card._id === updatedCard._id ? updatedCard : card
                            )
                        }));
                        setLists(updatedLists);
                    }}
                    onDelete={(cardId) => {
                        handleDeleteCard(cardId, selectedCard.list);
                        setSelectedCard(null);
                    }}
                />
            )}
        </div>
    );
};

export default Board;
