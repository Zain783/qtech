import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

export default function SalesmanCustomerPrint() {
    const { id } = useParams();
    const [salesman, setSalesman] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { protocol, hostname, port } = window.location;
    const fullDomainWithPort = `${protocol}//${hostname}${port ? `:${port}` : ''}`;

    useEffect(() => {
        fetchSalesmanCustomers();
        // Auto-print when component loads
        setTimeout(() => {
            if (!loading && !error) {
                window.print();
            }
        }, 1000);
    }, [id]);

    const fetchSalesmanCustomers = async () => {
        try {
            setLoading(true);
            // Get salesman info
            const salesmanResponse = await axios.get(`/admin/salesmen`);
            const currentSalesman = salesmanResponse.data.find(s => s.id == id);
            
            // Get salesman's customers
            const customersResponse = await axios.get(`/admin/salesman/print-list/${id}`);
            
            setSalesman(currentSalesman);
            setCustomers(customersResponse.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load salesman customers');
            setLoading(false);
            toast.error(err.response?.data?.message || 'Error loading salesman customers');
        }
    };

    if (loading) return <div className="text-center p-5"><i className="fas fa-spinner fa-spin fa-2x"></i></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!salesman) return <div className="alert alert-warning">Salesman not found</div>;

    return (
        <div className="container-fluid print-container">
            <div className="d-print-none mb-3 text-center">
                <h2>Customer List for {salesman.name}</h2>
                <button className="btn btn-primary" onClick={() => window.print()}>
                    <i className="fas fa-print"></i> Print
                </button>
                <button className="btn btn-secondary ml-2" onClick={() => window.close()}>
                    <i className="fas fa-times"></i> Close
                </button>
            </div>

            {/* Print Header */}
            <div className="print-header text-center mb-4">
                <h2 className="company-name">QPOS System</h2>
                <h3>Customer Assignment List</h3>
                <div className="salesman-info">
                    <p><strong>Salesman:</strong> {salesman.name}</p>
                    <p><strong>Email:</strong> {salesman.email}</p>
                    <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Customer Table */}
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Customer</th>
                        <th>Contact</th>
                        <th>Product</th>
                        <th>Installment</th>
                        <th>Balance</th>
                        <th>Collection</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.length > 0 ? (
                        customers.map((sale, index) => {
                            const remainingBalance = sale.total - sale.down_payment - 
                                (sale.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0);
                            
                            return (
                                <tr key={sale.id}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <div><strong>{sale.customer.name}</strong></div>
                                        <div>{sale.customer.address}</div>
                                    </td>
                                    <td>
                                        <div>Phone: {sale.customer.phone}</div>
                                        <div>CNIC: {sale.customer.cnic}</div>
                                    </td>
                                    <td>
                                        <div>{sale.product.name}</div>
                                        <div>ID: {sale.product.id}</div>
                                    </td>
                                    <td>
                                        <div>Monthly: {sale.monthly_installment}</div>
                                        <div>Duration: {sale.duration} months</div>
                                    </td>
                                    <td>{remainingBalance}</td>
                                    <td className="collection-column">
                                        <div className="signature-line">______________</div>
                                        <div className="small text-muted">Signature</div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="7" className="text-center">No customers assigned</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Summary Section */}
            <div className="summary-section mt-4">
                <div className="row">
                    <div className="col-md-6">
                        <p><strong>Total Customers:</strong> {customers.length}</p>
                        <p><strong>Total Outstanding:</strong> {
                            customers.reduce((total, sale) => {
                                const remainingBalance = sale.total - sale.down_payment - 
                                    (sale.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0);
                                return total + remainingBalance;
                            }, 0)
                        }</p>
                    </div>
                    <div className="col-md-6 text-right">
                        <div className="signature-section">
                            <div className="signature-line">__________________________</div>
                            <p>Supervisor Signature</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx>{`
                @media print {
                    body {
                        font-size: 12pt;
                    }
                    .print-container {
                        width: 100%;
                        max-width: 100%;
                    }
                    .print-header {
                        margin-bottom: 20px;
                    }
                    .company-name {
                        font-size: 24pt;
                        font-weight: bold;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 8px;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                    .collection-column {
                        width: 120px;
                    }
                    .signature-line {
                        margin-top: 10px;
                        margin-bottom: 5px;
                    }
                    .signature-section {
                        margin-top: 50px;
                    }
                    .d-print-none {
                        display: none !important;
                    }
                }
            `}</style>
            <Toaster position="top-right" reverseOrder={false} />
        </div>
    );
}