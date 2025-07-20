import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

export default function SalesmanAssignment() {
    const [salesmen, setSalesmen] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedSalesmen, setSelectedSalesmen] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState(null);
    const [assignmentResult, setAssignmentResult] = useState(null);

    useEffect(() => {
        fetchSalesmenAndCustomers();
    }, []);

    const fetchSalesmenAndCustomers = async () => {
        try {
            setLoading(true);
            const [salesmenResponse, customersResponse] = await Promise.all([
                axios.get('/admin/salesmen'),
                axios.get('/admin/unassigned-installment-customers')
            ]);
            setSalesmen(salesmenResponse.data);
            setCustomers(customersResponse.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load data');
            setLoading(false);
            toast.error(err.response?.data?.message || 'Error loading data');
        }
    };

    const handleSalesmanSelection = (salesmanId) => {
        if (selectedSalesmen.includes(salesmanId)) {
            setSelectedSalesmen(selectedSalesmen.filter(id => id !== salesmanId));
        } else {
            setSelectedSalesmen([...selectedSalesmen, salesmanId]);
        }
    };

    const handleAssignSalesmen = async () => {
        if (selectedSalesmen.length === 0) {
            toast.error('Please select at least one salesman');
            return;
        }

        if (customers.length === 0) {
            toast.error('No customers available for assignment');
            return;
        }

        try {
            setAssigning(true);
            const response = await axios.post('/admin/assign-salesmen', {
                salesman_ids: selectedSalesmen
            });
            setAssignmentResult(response.data);
            toast.success('Customers assigned successfully!');
            // Refresh data
            fetchSalesmenAndCustomers();
            setAssigning(false);
        } catch (err) {
            setAssigning(false);
            toast.error(err.response?.data?.message || 'Error assigning salesmen');
        }
    };

    const printAssignmentList = (salesmanId) => {
        window.open(`/admin/salesman/${salesmanId}/customer-list/print`, '_blank');
    };

    if (loading) return <div className="text-center p-5"><i className="fas fa-spinner fa-spin fa-2x"></i></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Salesman Assignment</h3>
            </div>
            <div className="card-body">
                <div className="row mb-4">
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-header bg-primary text-white">
                                <h5 className="mb-0">Select Salesmen</h5>
                            </div>
                            <div className="card-body">
                                {salesmen.length > 0 ? (
                                    <div className="list-group">
                                        {salesmen.map(salesman => (
                                            <div key={salesman.id} className="list-group-item">
                                                <div className="form-check">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id={`salesman-${salesman.id}`}
                                                        checked={selectedSalesmen.includes(salesman.id)}
                                                        onChange={() => handleSalesmanSelection(salesman.id)}
                                                    />
                                                    <label className="form-check-label" htmlFor={`salesman-${salesman.id}`}>
                                                        {salesman.name} - {salesman.email}
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="alert alert-info">No salesmen available</div>
                                )}
                            </div>
                            <div className="card-footer">
                                <button 
                                    className="btn btn-success" 
                                    onClick={handleAssignSalesmen} 
                                    disabled={selectedSalesmen.length === 0 || assigning || customers.length === 0}
                                >
                                    {assigning ? (
                                        <><i className="fas fa-spinner fa-spin"></i> Assigning...</>
                                    ) : (
                                        <><i className="fas fa-user-check"></i> Assign Customers</>  
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-header bg-info text-white">
                                <h5 className="mb-0">Unassigned Customers ({customers.length})</h5>
                            </div>
                            <div className="card-body">
                                {customers.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-bordered table-striped">
                                            <thead>
                                                <tr>
                                                    <th>Customer</th>
                                                    <th>Product</th>
                                                    <th>Total Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {customers.map(customer => (
                                                    <tr key={customer.id}>
                                                        <td>{customer.customer.name}</td>
                                                        <td>{customer.product.name}</td>
                                                        <td>{customer.total}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="alert alert-info">No unassigned customers</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {assignmentResult && (
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header bg-success text-white">
                                    <h5 className="mb-0">Assignment Results</h5>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-bordered table-striped">
                                            <thead>
                                                <tr>
                                                    <th>Salesman</th>
                                                    <th>Assigned Customers</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {assignmentResult.assignments.map(assignment => (
                                                    <tr key={assignment.salesman.id}>
                                                        <td>{assignment.salesman.name}</td>
                                                        <td>{assignment.customer_count}</td>
                                                        <td>
                                                            <button 
                                                                className="btn btn-primary btn-sm"
                                                                onClick={() => printAssignmentList(assignment.salesman.id)}
                                                            >
                                                                <i className="fas fa-print"></i> Print Customer List
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
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