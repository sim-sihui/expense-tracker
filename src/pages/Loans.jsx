import React, { useState, useMemo } from 'react';
import { formatMoney } from '../utils/formatMoney';
import './Loans.css';

const emptyLoan = {
    friend: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'lent', // 'lent' (friend owes you) or 'borrowed' (you owe friend)
    settled: false,
};

const Loans = ({ loans = [], onAddLoan, onUpdateLoan, onDeleteLoan }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(emptyLoan);
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'settled'

    // Calculations
    const summary = useMemo(() => {
        const activeLoans = loans.filter(l => !l.settled);
        const owed = activeLoans.filter(l => l.type === 'lent').reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
        const owe = activeLoans.filter(l => l.type === 'borrowed').reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
        return { owed, owe, net: owed - owe };
    }, [loans]);

    const friendsBalances = useMemo(() => {
        const activeLoans = loans.filter(l => !l.settled);
        const friends = {};
        activeLoans.forEach(l => {
            if (!friends[l.friend]) friends[l.friend] = 0;
            if (l.type === 'lent') {
                friends[l.friend] += parseFloat(l.amount || 0);
            } else {
                friends[l.friend] -= parseFloat(l.amount || 0);
            }
        });
        return Object.entries(friends)
            .map(([name, balance]) => ({ name, balance }))
            .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
    }, [loans]);

    const filteredLoans = useMemo(() => {
        let result = [...loans].sort((a, b) => new Date(b.date) - new Date(a.date));
        if (filter === 'active') result = result.filter(l => !l.settled);
        if (filter === 'settled') result = result.filter(l => l.settled);
        return result;
    }, [loans, filter]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.friend || !formData.amount || !formData.description) return;

        const payload = { ...formData, amount: parseFloat(formData.amount) };
        if (editingId) {
            onUpdateLoan(editingId, payload);
        } else {
            onAddLoan(payload);
        }
        closeForm();
    };

    const openAdd = () => {
        setEditingId(null);
        setFormData(emptyLoan);
        setShowForm(true);
    };

    const openEdit = (loan) => {
        setEditingId(loan.id);
        setFormData({ ...loan });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData(emptyLoan);
    };

    const toggleSettled = (loan) => {
        onUpdateLoan(loan.id, { ...loan, settled: !loan.settled });
    };

    const settleFriend = (friendName) => {
        const friendLoans = loans.filter(l => l.friend === friendName && !l.settled);
        friendLoans.forEach(l => onUpdateLoan(l.id, { ...l, settled: true }));
    };

    return (
        <div className="loans-page">
            <div className="loans-header">
                <div className="header-info">
                    <h1>Loans</h1>
                    <p className="subtitle">Keep track of shared expenses and debts</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>+ Add Loan</button>
            </div>

            <div className="loans-summary">
                <div className="summary-card owed">
                    <div className="card-icon">📈</div>
                    <div className="card-content">
                        <h3>You are owed</h3>
                        <p className="amount">${formatMoney(summary.owed)}</p>
                    </div>
                </div>
                <div className="summary-card owe">
                    <div className="card-icon">📉</div>
                    <div className="card-content">
                        <h3>You owe</h3>
                        <p className="amount">${formatMoney(summary.owe)}</p>
                    </div>
                </div>
                <div className={`summary-card net ${summary.net >= 0 ? 'positive' : 'negative'}`}>
                    <div className="card-icon">⚖️</div>
                    <div className="card-content">
                        <h3>Net Balance</h3>
                        <p className="amount">${formatMoney(Math.abs(summary.net))}</p>
                        <span className="balance-label">{summary.net >= 0 ? 'To receive' : 'To pay'}</span>
                    </div>
                </div>
            </div>

            <div className="loans-content">
                <div className="friends-column">
                    <div className="section-header">
                        <h2>Friends</h2>
                    </div>
                    <div className="friends-list">
                        {friendsBalances.length > 0 ? (
                            friendsBalances.map(f => (
                                <div key={f.name} className="friend-item">
                                    <div className="friend-info">
                                        <div className="friend-avatar" style={{ background: `hsl(${f.name.length * 40 % 360}, 60%, 50%)` }}>
                                            {f.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="friend-details">
                                            <span className="friend-name">{f.name}</span>
                                            <span className={`friend-status ${f.balance >= 0 ? 'positive' : 'negative'}`}>
                                                {f.balance === 0 ? 'Settled' : f.balance > 0 ? `owes you $${formatMoney(f.balance)}` : `you owe $${formatMoney(Math.abs(f.balance))}`}
                                            </span>
                                        </div>
                                    </div>
                                    {f.balance !== 0 && (
                                        <button className="btn-settle-mini" onClick={() => settleFriend(f.name)}>Settle</button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="empty-mini">No active debts with friends.</p>
                        )}
                    </div>
                </div>

                <div className="activity-column">
                    <div className="section-header">
                        <h2>Recent Activity</h2>
                        <div className="filter-tabs">
                            <button
                                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => setFilter('all')}
                            >All</button>
                            <button
                                className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
                                onClick={() => setFilter('active')}
                            >Active</button>
                            <button
                                className={`filter-tab ${filter === 'settled' ? 'active' : ''}`}
                                onClick={() => setFilter('settled')}
                            >Settled</button>
                        </div>
                    </div>

                    <div className="activity-list">
                        {filteredLoans.length > 0 ? (
                            filteredLoans.map(l => (
                                <div key={l.id} className={`loan-card ${l.settled ? 'settled' : ''}`} onClick={() => openEdit(l)}>
                                    <div className="loan-date">
                                        {new Date(l.date).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="loan-main">
                                        <div className="loan-description">{l.description}</div>
                                        <div className="loan-sub">{l.friend} • {l.type === 'lent' ? 'You lent' : 'You borrowed'}</div>
                                    </div>
                                    <div className={`loan-amount ${l.type} ${l.settled ? 'settled-text' : ''}`}>
                                        {l.type === 'lent' ? '+' : '-'} ${formatMoney(l.amount)}
                                    </div>
                                    <div className="loan-actions" onClick={e => e.stopPropagation()}>
                                        <button
                                            className={`btn-check ${l.settled ? 'active' : ''}`}
                                            onClick={() => toggleSettled(l)}
                                            title={l.settled ? "Mark as active" : "Mark as settled"}
                                        >
                                            {l.settled ? '✓' : '○'}
                                        </button>
                                        <button className="btn-delete-mini" onClick={() => onDeleteLoan(l.id)}>✕</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <p>No activity found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={closeForm}>
                    <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingId ? 'Edit Loan' : 'Add New Loan'}</h2>
                            <button className="modal-close" onClick={closeForm}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Friend's Name</label>
                                <input
                                    type="text"
                                    placeholder="Who are you splitting with?"
                                    value={formData.friend}
                                    onChange={e => setFormData({ ...formData, friend: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    placeholder="What was it for? (e.g. Dinner, Movie)"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Amount ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Type</label>
                                <div className="type-toggle">
                                    <button
                                        type="button"
                                        className={`type-btn lent ${formData.type === 'lent' ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, type: 'lent' })}
                                    >
                                        You lent money
                                    </button>
                                    <button
                                        type="button"
                                        className={`type-btn borrowed ${formData.type === 'borrowed' ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, type: 'borrowed' })}
                                    >
                                        You borrowed money
                                    </button>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={closeForm}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? 'Save Changes' : 'Add Loan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Loans;
