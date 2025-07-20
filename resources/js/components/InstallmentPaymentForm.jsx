import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

export default function InstallmentPaymentForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [payment, setPayment] = useState({
        amount: '',
        notes: ''
    });

    useEffect(() => {
        fetchSaleDetails();
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
                                <div><strong>Monthly Installment:</strong> {sale.monthly_installment}</div>
                                <div><strong>Down Payment:</strong> {sale.down_payment}</div>
                                <div><strong>Total Paid:</strong> {sale.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0}</div>
                                <div><strong>Remaining Balance:</strong> {remainingBalance}</div>
                            </div>
                        </div>
                    </div>
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