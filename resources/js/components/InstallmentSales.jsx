import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

export default function InstallmentSales() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { protocol, hostname, port } = window.location;
    const fullDomainWithPort = `${protocol}//${hostname}${port ? `:${port}` : ''}`;

    useEffect(() => {
        fetchInstallmentSales();
    }, []);

    const fetchInstallmentSales = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/installment-sales');
            setSales(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load installment sales');
            setLoading(false);
            toast.error(err.response?.data?.message || 'Error loading installment sales');
        }
    };

    if (loading) return <div className="text-center p-5"><i className="fas fa-spinner fa-spin fa-2x"></i></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Installment Sales</h3>
            </div>
            <div className="card-body">
                <div className="table-responsive">
                    <table className="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Customer Information</th>
                                <th>Financial Information</th>
                                <th>Guarantor Information</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length > 0 ? (
                                sales.map(sale => (
                                    <tr key={sale.id}>
                                        <td>
                                            <div className="d-flex flex-column align-items-center">
                                                <img 
                                                    src={sale.product && sale.product.image ? `${fullDomainWithPort}/storage/${sale.product.image}` : `${fullDomainWithPort}/assets/images/no-image.png`} 
                                                    alt={sale.product?.name || 'N/A'}
                                                    className="img-thumbnail mb-2" 
                                                    style={{ width: '80px', height: '80px' }}
                                                    onError={e => { e.target.onerror = null; e.target.src = `${fullDomainWithPort}/assets/images/no-image.png`; }}
                                                />
                                                <div className="text-center">
                                                    <strong>{sale.product?.name || 'N/A'}</strong>
                                                    <div>ID: {sale.product?.id || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div><strong>Name:</strong> {sale.customer?.name || 'N/A'}</div>
                                            <div><strong>Address:</strong> {sale.customer?.address || 'N/A'}</div>
                                            <div><strong>Phone:</strong> {sale.customer?.phone || 'N/A'}</div>
                                            <div><strong>CNIC:</strong> {sale.customer?.cnic || 'N/A'}</div>
                                        </td>
                                        <td>
                                            <div><strong>Total Amount:</strong> {sale.total}</div>
                                            <div><strong>Down Payment:</strong> {sale.down_payment}</div>
                                            <div><strong>Monthly Installment:</strong> {sale.monthly_installment}</div>
                                            <div><strong>Duration:</strong> {sale.duration} months</div>
                                            <div><strong>Paid Amount:</strong> {sale.payments && sale.payments.length > 0 ? sale.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) : 0}</div>
                                            <div><strong>Remaining:</strong> {sale.remaining_balance}</div>
                                        </td>
                                        <td>
                                            <div><strong>Name:</strong> {sale.guarantor?.name || 'N/A'}</div>
                                            <div><strong>Address:</strong> {sale.guarantor?.address || 'N/A'}</div>
                                            <div><strong>Phone:</strong> {sale.guarantor?.phone || 'N/A'}</div>
                                            <div><strong>CNIC:</strong> {sale.guarantor?.cnic || 'N/A'}</div>
                                            <div><strong>Relationship:</strong> {sale.guarantor?.relationship || 'N/A'}</div>
                                        </td>
                                        <td>
                                            <Link to={`/admin/installment-sales/${sale.id}`} className="btn btn-info btn-sm mb-1 w-100">
                                                <i className="fas fa-eye"></i> View Details
                                            </Link>
                                            <Link to={`/admin/installment-sales/${sale.id}/payments`} className="btn btn-success btn-sm mb-1 w-100">
                                                <i className="fas fa-money-bill"></i> Payments
                                            </Link>
                                            <button className="btn btn-primary btn-sm w-100" onClick={() => window.open(`/admin/installment-sales/${sale.id}/print`, '_blank')}>
                                                <i className="fas fa-print"></i> Print
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center">No installment sales found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <Toaster position="top-right" reverseOrder={false} />
        </div>
    );
}