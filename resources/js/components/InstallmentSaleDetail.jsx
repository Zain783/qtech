import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

export default function InstallmentSaleDetail() {
    const { id } = useParams();
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { protocol, hostname, port } = window.location;
    const fullDomainWithPort = `${protocol}//${hostname}${port ? `:${port}` : ''}`;

    useEffect(() => {
        fetchSaleDetails();
    }, [id]);

    const fetchSaleDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/admin/installment-sales/${id}`);
            setSale(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load sale details');
            setLoading(false);
            toast.error(err.response?.data?.message || 'Error loading sale details');
        }
    };

    if (loading) return <div className="text-center p-5"><i className="fas fa-spinner fa-spin fa-2x"></i></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!sale) return <div className="alert alert-warning">Sale not found</div>;

    return (
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h3 className="card-title">Installment Sale Details</h3>
                <div>
                    <Link to="/admin/installment-sales" className="btn btn-secondary mr-2">
                        <i className="fas fa-arrow-left"></i> Back to List
                    </Link>
                    <button className="btn btn-primary" onClick={() => window.print()}>
                        <i className="fas fa-print"></i> Print
                    </button>
                </div>
            </div>
            <div className="card-body">
                <div className="row">
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-header bg-primary text-white">
                                <h5 className="mb-0">Customer Information</h5>
                            </div>
                            <div className="card-body">
                                <div className="text-center mb-3">
                                    <img 
                                        src={`${fullDomainWithPort}/storage/${sale.customer.image}`} 
                                        alt={sale.customer.name}
                                        className="img-thumbnail" 
                                        style={{ width: '150px', height: '150px' }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `${fullDomainWithPort}/assets/images/no-image.png`;
                                        }}
                                    />
                                </div>
                                <div><strong>Name:</strong> {sale.customer.name}</div>
                                <div><strong>Address:</strong> {sale.customer.address}</div>
                                <div><strong>Phone:</strong> {sale.customer.phone}</div>
                                <div><strong>CNIC:</strong> {sale.customer.cnic}</div>
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
                                        src={`${fullDomainWithPort}/storage/${sale.product.image}`} 
                                        alt={sale.product.name}
                                        className="img-thumbnail" 
                                        style={{ width: '150px', height: '150px' }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `${fullDomainWithPort}/assets/images/no-image.png`;
                                        }}
                                    />
                                </div>
                                <div><strong>Name:</strong> {sale.product.name}</div>
                                <div><strong>ID:</strong> {sale.product.id}</div>
                                <div><strong>Price:</strong> {sale.price}</div>
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
                                <div><strong>Name:</strong> {sale.guarantor.name}</div>
                                <div><strong>Address:</strong> {sale.guarantor.address}</div>
                                <div><strong>Phone:</strong> {sale.guarantor.phone}</div>
                                <div><strong>CNIC:</strong> {sale.guarantor.cnic}</div>
                                <div><strong>Relationship:</strong> {sale.guarantor.relationship}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-header bg-warning text-dark">
                                <h5 className="mb-0">Installment Plan</h5>
                            </div>
                            <div className="card-body">
                                <div><strong>Price:</strong> {sale.price}</div>
                                <div><strong>Profit:</strong> {sale.profit}</div>
                                <div><strong>Total Amount:</strong> {sale.total}</div>
                                <div><strong>Down Payment:</strong> {sale.down_payment}</div>
                                {sale.interest_rate !== undefined && (
                                    <div><strong>Interest Rate:</strong> {sale.interest_rate}%</div>
                                )}
                                <div><strong>Monthly Installment:</strong> {sale.monthly_installment}</div>
                                <div><strong>Duration:</strong> {sale.duration} months</div>
                                <div><strong>Status:</strong> <span className="badge badge-primary">{sale.status}</span></div>
                                <div><strong>Created On:</strong> {new Date(sale.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row mt-3">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Payment History</h5>
                                <Link to={`/admin/installment-sales/${id}/payments/add`} className="btn btn-success btn-sm">
                                    <i className="fas fa-plus"></i> Add Payment
                                </Link>
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
                                                <th>Collected By</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sale.payments && sale.payments.length > 0 ? (
                                                sale.payments.map((payment, index) => (
                                                    <tr key={payment.id}>
                                                        <td>{index + 1}</td>
                                                        <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                                                        <td>{payment.amount}</td>
                                                        <td>{payment.notes || '-'}</td>
                                                        <td>{payment.collected_by || 'Admin'}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="text-center">No payment history found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th colSpan="2" className="text-right">Total Paid:</th>
                                                <th>{sale.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0}</th>
                                                <th colSpan="2"></th>
                                            </tr>
                                            <tr>
                                                <th colSpan="2" className="text-right">Remaining Balance:</th>
                                                <th>{sale.total - sale.down_payment - (sale.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0)}</th>
                                                <th colSpan="2"></th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {sale.salesman && (
                    <div className="row mt-3">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header bg-dark text-white">
                                    <h5 className="mb-0">Assigned Salesman</h5>
                                </div>
                                <div className="card-body">
                                    <div><strong>Name:</strong> {sale.salesman.name}</div>
                                    <div><strong>Email:</strong> {sale.salesman.email}</div>
                                    <div><strong>Phone:</strong> {sale.salesman.phone || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Toaster position="top-right" reverseOrder={false} />
        </div>
    );
}