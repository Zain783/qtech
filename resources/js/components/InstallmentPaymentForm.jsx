import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

export default function InstallmentPaymentForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [sale, setSale] = useState(window.installmentSale || null);
    const [loading, setLoading] = useState(!window.installmentSale);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [payment, setPayment] = useState({
        amount: '',
        notes: ''
    });
    const [editingPaymentId, setEditingPaymentId] = useState(null);
    const [editPayment, setEditPayment] = useState({ amount: '', notes: '' });

    useEffect(() => {
        if (!window.installmentSale) {
            fetchSaleDetails();
        }
    }, [id]);

    const fetchSaleDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/admin/installment-sales/${id}`);
            setSale(response.data);
            // Set default payment amount to monthly installment
            setPayment(prev => ({
                ...prev,
                amount: response.data.monthly_installment
            }));
            setLoading(false);
        } catch (err) {
            setError('Failed to load sale details');
            setLoading(false);
            toast.error(err.response?.data?.message || 'Error loading sale details');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPayment(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!payment.amount || parseFloat(payment.amount) <= 0) {
            toast.error('Please enter a valid payment amount');
            return;
        }

        const remainingBalance = sale.total - sale.down_payment - 
            (sale.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0);
        
        if (parseFloat(payment.amount) > remainingBalance) {
            toast.error(`Payment amount cannot exceed the remaining balance of ${remainingBalance}`);
            return;
        }

        try {
            setSubmitting(true);
            await axios.post(`/admin/installment-sales/${id}/payments`, payment);
            toast.success('Payment added successfully!');
            navigate(`/admin/installment-sales/${id}`);
        } catch (err) {
            setSubmitting(false);
            toast.error(err.response?.data?.message || 'Error adding payment');
        }
    };

    // Edit payment handlers
    const startEditPayment = (payment) => {
        setEditingPaymentId(payment.id);
        setEditPayment({ amount: payment.amount, notes: payment.note || '' });
    };
    const cancelEditPayment = () => {
        setEditingPaymentId(null);
        setEditPayment({ amount: '', notes: '' });
    };
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditPayment(prev => ({ ...prev, [name]: value }));
    };
    const submitEditPayment = async (e) => {
        e.preventDefault();
        if (!editPayment.amount || parseFloat(editPayment.amount) <= 0) {
            toast.error('Please enter a valid payment amount');
            return;
        }
        try {
            await axios.put(`/admin/installment-payments/${editingPaymentId}`, editPayment);
            toast.success('Payment updated successfully!');
            setEditingPaymentId(null);
            fetchSaleDetails();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error updating payment');
        }
    };
    const deletePayment = async (paymentId) => {
        if (!window.confirm('Are you sure you want to delete this payment?')) return;
        try {
            await axios.delete(`/admin/installment-payments/${paymentId}`);
            toast.success('Payment deleted successfully!');
            fetchSaleDetails();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error deleting payment');
        }
    };

    if (loading) return <div className="text-center p-5"><i className="fas fa-spinner fa-spin fa-2x"></i></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!sale) return <div className="alert alert-warning">Sale not found</div>;

    const remainingBalance = sale.total - sale.down_payment - 
        (sale.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0);

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Add Payment</h3>
            </div>
            <div className="card-body">
                <div className="row mb-4">
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-header bg-info text-white">
                                <h5 className="mb-0">Customer & Product Info</h5>
                            </div>
                            <div className="card-body">
                                <div><strong>Customer:</strong> {sale.customer.name}</div>
                                <div><strong>Phone:</strong> {sale.customer.phone}</div>
                                <div><strong>Product:</strong> {sale.product.name}</div>
                                <div><strong>Total Amount:</strong> {sale.total}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-header bg-warning text-dark">
                                <h5 className="mb-0">Payment Summary</h5>
                            </div>
                            <div className="card-body">
                                <div><strong>Down Payment:</strong> {sale.down_payment}</div>
                                {sale.interest_rate !== undefined && (
                                    <div><strong>Interest Rate:</strong> {sale.interest_rate}%</div>
                                )}
                                <div><strong>Monthly Installment:</strong> {sale.monthly_installment}</div>
                                <div><strong>Total Paid:</strong> {sale.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0}</div>
                                <div><strong>Remaining Balance:</strong> {remainingBalance}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <h5>Previous Payments</h5>
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Amount</th>
                                <th>Notes</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.payments && sale.payments.length > 0 ? sale.payments.map((p, idx) => (
                                <tr key={p.id}>
                                    <td>{idx + 1}</td>
                                    <td>
                                        {editingPaymentId === p.id ? (
                                            <input type="number" name="amount" value={editPayment.amount} onChange={handleEditChange} className="form-control" min="0.01" step="0.01" required />
                                        ) : (
                                            p.amount
                                        )}
                                    </td>
                                    <td>
                                        {editingPaymentId === p.id ? (
                                            <input type="text" name="notes" value={editPayment.notes} onChange={handleEditChange} className="form-control" />
                                        ) : (
                                            p.note
                                        )}
                                    </td>
                                    <td>{p.paid_at ? new Date(p.paid_at).toLocaleString() : ''}</td>
                                    <td>
                                        {editingPaymentId === p.id ? (
                                            <>
                                                <button className="btn btn-success btn-sm me-2" onClick={submitEditPayment}><i className="fas fa-save"></i></button>
                                                <button className="btn btn-secondary btn-sm" onClick={cancelEditPayment}><i className="fas fa-times"></i></button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="btn btn-primary btn-sm me-2" onClick={() => startEditPayment(p)}><i className="fas fa-edit"></i></button>
                                                <button className="btn btn-danger btn-sm" onClick={() => deletePayment(p.id)}><i className="fas fa-trash"></i></button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" className="text-center">No payments yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-6">
                            <div className="form-group">
                                <label htmlFor="amount">Payment Amount</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="amount"
                                    name="amount"
                                    value={payment.amount}
                                    onChange={handleChange}
                                    min="0.01"
                                    max={remainingBalance}
                                    step="0.01"
                                    required
                                />
                                <small className="form-text text-muted">
                                    Default is the monthly installment amount. Maximum is the remaining balance.
                                </small>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-group">
                                <label htmlFor="notes">Notes (Optional)</label>
                                <textarea
                                    className="form-control"
                                    id="notes"
                                    name="notes"
                                    value={payment.notes}
                                    onChange={handleChange}
                                    rows="3"
                                ></textarea>
                            </div>
                        </div>
                    </div>
                    <div className="form-group d-flex justify-content-between">
                        <Link to={`/admin/installment-sales/${id}`} className="btn btn-secondary">
                            <i className="fas fa-arrow-left"></i> Cancel
                        </Link>
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            disabled={submitting || remainingBalance <= 0}
                        >
                            {submitting ? (
                                <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                            ) : (
                                <><i className="fas fa-save"></i> Save Payment</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <Toaster position="top-right" reverseOrder={false} />
        </div>
    );
}