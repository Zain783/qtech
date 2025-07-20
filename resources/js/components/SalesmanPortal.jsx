import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

export default function SalesmanPortal() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSale, setSelectedSale] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const { protocol, hostname, port } = window.location;
    const fullDomainWithPort = `${protocol}//${hostname}${port ? `:${port}` : ''}`;

    useEffect(() => {
        fetchSalesmanSales();
    }, []);

    const fetchSalesmanSales = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/salesman/installment-sales');
            setSales(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load assigned sales');
            setLoading(false);
            toast.error(err.response?.data?.message || 'Error loading assigned sales');
        }
    };

    const viewDetails = (sale) => {
        setSelectedSale(sale);
        setShowDetailsModal(true);
    };

    const closeDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedSale(null);
    };

    if (loading) return <div className="text-center p-5"><i className="fas fa-spinner fa-spin fa-2x"></i></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">My Assigned Customers</h3>
            </div>
            <div className="card-body">
                <div className="table-responsive">
                    <table className="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Product</th>
                                <th>Installment Details</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length > 0 ? (
                                sales.map(sale => (
                                    <tr key={sale.id}>
                                        <td>
                                            <div><strong>Name:</strong> {sale.customer.name}</div>
                                            <div><strong>Phone:</strong> {sale.customer.phone}</div>
                                            <div><strong>CNIC:</strong> {sale.customer.cnic}</div>
                                        </td>
                                        <td>
                                            <div className="d-flex flex-column align-items-center">
                                                <img 
                                                    src={`${fullDomainWithPort}/storage/${sale.product.image}`} 
                                                    alt={sale.product.name}
                                                    className="img-thumbnail mb-2" 
                                                    style={{ width: '60px', height: '60px' }}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = `${fullDomainWithPort}/assets/images/no-image.png`;
                                                    }}
                                                />
                                                <div className="text-center">
                                                    <strong>{sale.product.name}</strong>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div><strong>Total:</strong> {sale.total}</div>
                                            <div><strong>Monthly:</strong> {sale.monthly_installment}</div>
                                            <div><strong>Remaining:</strong> {sale.total - sale.down_payment - (sale.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0)}</div>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-info btn-sm mb-1 w-100"
                                                onClick={() => viewDetails(sale)}
                                            >
                                                <i className="fas fa-eye"></i> View Details
                                            </button>
                                            <Link to={`/admin/salesman/installment-sales/${sale.id}/payments`} className="btn btn-success btn-sm mb-1 w-100">
                                                <i className="fas fa-money-bill"></i> Payments
                                            </Link>
                                            <button className="btn btn-primary btn-sm w-100" onClick={() => window.open(`/admin/salesman/installment-sales/${sale.id}/print`, '_blank')}>
                                                <i className="fas fa-print"></i> Print
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center">No assigned customers found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Customer Details Modal */}
            {showDetailsModal && selectedSale && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Customer Details</h5>
                                <button type="button" className="close" onClick={closeDetailsModal}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header bg-primary text-white">
                                                <h5 className="mb-0">Customer Information</h5>
                                            </div>
                                            <div className="card-body">
                                                <div className="text-center mb-3">
                                                    <img 
                                                        src={`${fullDomainWithPort}/storage/${selectedSale.customer.image}`} 
                                                        alt={selectedSale.customer.name}
                                                        className="img-thumbnail" 
                                                        style={{ width: '150px', height: '150px' }}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = `${fullDomainWithPort}/assets/images/no-image.png`;
                                                        }}
                                                    />
                                                </div>
                                                <div><strong>Name:</strong> {selectedSale.customer.name}</div>
                                                <div><strong>Address:</strong> {selectedSale.customer.address}</div>
                                                <div><strong>Phone:</strong> {selectedSale.customer.phone}</div>
                                                <div><strong>CNIC:</strong> {selectedSale.customer.cnic}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header bg-info text-white">
                                                <h5 className="mb-0">Product Information</h5>
                                            </div>
                                            <div className="card-body">
                                                <div className="text-center mb-3">
                                                    <img 
                                                        src={`${fullDomainWithPort}/storage/${selectedSale.product.image}`} 
                                                        alt={selectedSale.product.name}
                                                        className="img-thumbnail" 
                                                        style={{ width: '150px', height: '150px' }}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = `${fullDomainWithPort}/assets/images/no-image.png`;
                                                        }}
                                                    />
                                                </div>
                                                <div><strong>Name:</strong> {selectedSale.product.name}</div>
                                                <div><strong>ID:</strong> {selectedSale.product.id}</div>
                                                <div><strong>Price:</strong> {selectedSale.price}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row mt-3">
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header bg-success text-white">
                                                <h5 className="mb-0">Guarantor Information</h5>
                                            </div>
                                            <div className="card-body">
                                                <div><strong>Name:</strong> {selectedSale.guarantor.name}</div>
                                                <div><strong>Address:</strong> {selectedSale.guarantor.address}</div>
                                                <div><strong>Phone:</strong> {selectedSale.guarantor.phone}</div>
                                                <div><strong>CNIC:</strong> {selectedSale.guarantor.cnic}</div>
                                                <div><strong>Relationship:</strong> {selectedSale.guarantor.relationship}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header bg-warning text-dark">
                                                <h5 className="mb-0">Installment Plan</h5>
                                            </div>
                                            <div className="card-body">
                                                <div><strong>Price:</strong> {selectedSale.price}</div>
                                                <div><strong>Profit:</strong> {selectedSale.profit}</div>
                                                <div><strong>Total Amount:</strong> {selectedSale.total}</div>
                                                <div><strong>Down Payment:</strong> {selectedSale.down_payment}</div>
                                                <div><strong>Monthly Installment:</strong> {selectedSale.monthly_installment}</div>
                                                <div><strong>Duration:</strong> {selectedSale.duration} months</div>
                                                <div><strong>Status:</strong> <span className="badge badge-primary">{selectedSale.status}</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row mt-3">
                                    <div className="col-12">
                                        <div className="card">
                                            <div className="card-header bg-secondary text-white">
                                                <h5 className="mb-0">Payment History</h5>
                                            </div>
                                            <div className="card-body">
                                                <div className="table-responsive">
                                                    <table className="table table-bordered table-striped">
                                                        <thead>
                                                            <tr>
                                                                <th>#</th>
                                                                <th>Date</th>
                                                                <th>Amount</th>
                                                                <th>Notes</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedSale.payments && selectedSale.payments.length > 0 ? (
                                                                selectedSale.payments.map((payment, index) => (
                                                                    <tr key={payment.id}>
                                                                        <td>{index + 1}</td>
                                                                        <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                                                                        <td>{payment.amount}</td>
                                                                        <td>{payment.notes || '-'}</td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan="4" className="text-center">No payment history found</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeDetailsModal}>Close</button>
                                <button type="button" className="btn btn-primary" onClick={() => window.open(`/admin/salesman/installment-sales/${selectedSale.id}/print`, '_blank')}>
                                    <i className="fas fa-print"></i> Print Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <Toaster position="top-right" reverseOrder={false} />
        </div>
    );
}