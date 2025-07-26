import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

export default function InstallmentSales() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [showListPrintModal, setShowListPrintModal] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [printOptions, setPrintOptions] = useState({
        includeCustomer: true,
        includeGuarantor: true,
        includeFinancial: true,
        includePaymentHistory: true,
        includeProductImage: true,
        paperSize: 'A4',
        orientation: 'portrait'
    });
    const [listPrintOptions, setListPrintOptions] = useState({
        groupBy: 'none', // none, salesman, status, dueDate
        includeImages: false,
        includeBalances: true,
        includeDueDates: true,
        includeContactInfo: true,
        paperSize: 'A4',
        orientation: 'landscape',
        title: 'Installment Sales Customer List'
    });
    const printRef = useRef();

    const { protocol, hostname, port } = window.location;
    const fullDomainWithPort = `${protocol}//${hostname}${port ? `:${port}` : ''}`;

    useEffect(() => {
        fetchInstallmentSales();
    }, []);

    const fetchInstallmentSales = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/installment-sales');
            setSales(response.data.filter(sale => sale.id));
            setLoading(false);
        } catch (err) {
            setError('Failed to load installment sales');
            setLoading(false);
            toast.error(err.response?.data?.message || 'Error loading installment sales');
        }
    };

    const handlePrint = (sale) => {
        setSelectedSale(sale);
        setShowPrintModal(true);
    };

    const handlePrintCustomerList = () => {
        setShowListPrintModal(true);
    };

    const handleListPrintConfirm = () => {
        const printWindow = window.open('', '_blank');
        const printContent = generateCustomerListPrintContent();

        printWindow.document.write(printContent);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);

        setShowListPrintModal(false);
        toast.success('Customer list print dialog opened successfully');
    };

    const handlePrintConfirm = () => {
        const printWindow = window.open('', '_blank');
        const printContent = generatePrintContent(selectedSale);

        printWindow.document.write(printContent);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);

        setShowPrintModal(false);
        toast.success('Print dialog opened successfully');
    };

    const handleSavePDF = async () => {
        try {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(generatePrintContent(selectedSale));
            printWindow.document.close();

            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 500);

            setShowPrintModal(false);
            toast.success('PDF save dialog opened. Choose "Save as PDF" in print options.');
        } catch (error) {
            toast.error('Error generating PDF');
        }
    };

    const generateCustomerListPrintContent = () => {
        const currentDate = new Date().toLocaleDateString();
        const currentTime = new Date().toLocaleTimeString();

        // Sort and group sales based on options
        let sortedSales = [...sales];

        if (listPrintOptions.groupBy === 'salesman') {
            sortedSales.sort((a, b) => {
                const salesmanA = a.salesman?.name || 'Unassigned';
                const salesmanB = b.salesman?.name || 'Unassigned';
                return salesmanA.localeCompare(salesmanB);
            });
        } else if (listPrintOptions.groupBy === 'status') {
            sortedSales.sort((a, b) => a.status.localeCompare(b.status));
        } else if (listPrintOptions.groupBy === 'dueDate') {
            sortedSales.sort((a, b) => {
                const dueDateA = calculateNextDueDate(a);
                const dueDateB = calculateNextDueDate(b);
                return new Date(dueDateA) - new Date(dueDateB);
            });
        }

        // Calculate totals
        const totalAmount = sortedSales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
        const totalPaid = sortedSales.reduce((sum, sale) => {
            const paidAmount = sale.payments?.reduce((pSum, payment) => pSum + parseFloat(payment.amount || 0), 0) || 0;
            return sum + parseFloat(sale.down_payment || 0) + paidAmount;
        }, 0);
        const totalRemaining = totalAmount - totalPaid;

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${listPrintOptions.title}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 10px;
                    color: #333;
                    font-size: 12px;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #333;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                .company-logo {
                    font-size: 20px;
                    font-weight: bold;
                    color: #2c3e50;
                }
                .document-title {
                    font-size: 18px;
                    margin: 10px 0;
                    color: #34495e;
                }
                .print-info {
                    font-size: 10px;
                    color: #666;
                    display: flex;
                    justify-content: space-between;
                    margin-top: 10px;
                }
                .summary-stats {
                    display: flex;
                    justify-content: space-around;
                    background-color: #f8f9fa;
                    padding: 10px;
                    margin-bottom: 20px;
                    border-radius: 5px;
                }
                .stat-item {
                    text-align: center;
                }
                .stat-value {
                    font-size: 16px;
                    font-weight: bold;
                    color: #2c3e50;
                }
                .stat-label {
                    font-size: 10px;
                    color: #666;
                }
                .customer-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 10px;
                }
                .customer-table th,
                .customer-table td {
                    border: 1px solid #ddd;
                    padding: 6px;
                    text-align: left;
                    vertical-align: top;
                }
                .customer-table th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                    font-size: 9px;
                }
                .customer-table tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .product-img {
                    width: 30px;
                    height: 30px;
                    object-fit: cover;
                    border-radius: 3px;
                }
                .status-badge {
                    padding: 2px 6px;
                    border-radius: 12px;
                    font-size: 8px;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .status-active {
                    background-color: #d4edda;
                    color: #155724;
                }
                .status-completed {
                    background-color: #d1ecf1;
                    color: #0c5460;
                }
                .status-overdue {
                    background-color: #f8d7da;
                    color: #721c24;
                }
                .amount {
                    font-weight: bold;
                    text-align: right;
                }
                .amount-positive {
                    color: #28a745;
                }
                .amount-negative {
                    color: #dc3545;
                }
                .group-header {
                    background-color: #e9ecef;
                    font-weight: bold;
                    padding: 8px;
                    border-top: 2px solid #333;
                }
                @media print {
                    body { margin: 0; }
                    .customer-table { font-size: 9px; }
                    .customer-table th,
                    .customer-table td { padding: 4px; }
                }
                @page {
                    size: ${listPrintOptions.paperSize} ${listPrintOptions.orientation};
                    margin: 0.5in;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-logo">Your Company Name</div>
                <div class="document-title">${listPrintOptions.title}</div>
                <div class="print-info">
                    <span>Generated on: ${currentDate} at ${currentTime}</span>
                    <span>Total Records: ${sortedSales.length}</span>
                </div>
            </div>

            <div class="summary-stats">
                <div class="stat-item">
                    <div class="stat-value">PKR ${totalAmount.toLocaleString()}</div>
                    <div class="stat-label">Total Sales Amount</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">PKR ${totalPaid.toLocaleString()}</div>
                    <div class="stat-label">Total Collected</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">PKR ${totalRemaining.toLocaleString()}</div>
                    <div class="stat-label">Total Outstanding</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${sortedSales.length}</div>
                    <div class="stat-label">Active Customers</div>
                </div>
            </div>

            <table class="customer-table">
                <thead>
                    <tr>
                        <th style="width: 3%;">S#</th>
                        ${listPrintOptions.includeImages ? '<th style="width: 5%;">Product</th>' : ''}
                        <th style="width: 15%;">Customer Name</th>
                        <th style="width: 12%;">Address</th>
                        ${listPrintOptions.includeContactInfo ? '<th style="width: 10%;">Phone</th>' : ''}
                        ${listPrintOptions.includeContactInfo ? '<th style="width: 12%;">CNIC</th>' : ''}
                        <th style="width: 10%;">Product</th>
                        <th style="width: 8%;">Total Amount</th>
                        ${listPrintOptions.includeBalances ? '<th style="width: 8%;">Paid</th>' : ''}
                        ${listPrintOptions.includeBalances ? '<th style="width: 8%;">Balance</th>' : ''}
                        <th style="width: 8%;">Monthly</th>
                        ${listPrintOptions.includeDueDates ? '<th style="width: 8%;">Next Due</th>' : ''}
                        <th style="width: 6%;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedSales.map((sale, index) => {
                        const paidAmount = parseFloat(sale.down_payment || 0) +
                            (sale.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0) || 0);
                        const remainingBalance = parseFloat(sale.total || 0) - paidAmount;
                        const nextDueDate = calculateNextDueDate(sale);

                        return `
                            <tr>
                                <td>${index + 1}</td>
                                ${listPrintOptions.includeImages ? `
                                    <td>
                                        <img class="product-img"
                                             src="${sale.product?.image ? `${fullDomainWithPort}/storage/${sale.product.image}` : `${fullDomainWithPort}/assets/images/no-image.png`}"
                                             alt="Product"
                                             onerror="this.src='${fullDomainWithPort}/assets/images/no-image.png'">
                                    </td>
                                ` : ''}
                                <td><strong>${sale.customer?.name || 'N/A'}</strong></td>
                                <td>${sale.customer?.address || 'N/A'}</td>
                                ${listPrintOptions.includeContactInfo ? `<td>${sale.customer?.phone || 'N/A'}</td>` : ''}
                                ${listPrintOptions.includeContactInfo ? `<td>${sale.customer?.cnic || 'N/A'}</td>` : ''}
                                <td>${sale.product?.name || 'N/A'}</td>
                                <td class="amount">PKR ${parseFloat(sale.total || 0).toLocaleString()}</td>
                                ${listPrintOptions.includeBalances ? `<td class="amount amount-positive">PKR ${paidAmount.toLocaleString()}</td>` : ''}
                                ${listPrintOptions.includeBalances ? `<td class="amount ${remainingBalance > 0 ? 'amount-negative' : 'amount-positive'}">PKR ${remainingBalance.toLocaleString()}</td>` : ''}
                                <td class="amount">PKR ${parseFloat(sale.monthly_installment || 0).toLocaleString()}</td>
                                ${listPrintOptions.includeDueDates ? `<td>${nextDueDate}</td>` : ''}
                                <td>
                                    <span class="status-badge status-${sale.status || 'active'}">
                                        ${(sale.status || 'active').toUpperCase()}
                                    </span>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>

            <div style="margin-top: 30px; font-size: 10px; color: #666;">
                <p><strong>Note:</strong> This report was generated automatically. Please verify all information before taking any action.</p>
                <p><strong>Legend:</strong> Active = Ongoing payments, Completed = Fully paid, Overdue = Payment due</p>
            </div>
        </body>
        </html>
        `;
    };

    const calculateNextDueDate = (sale) => {
        try {
            // This is a simplified calculation - you might need to adjust based on your business logic
            if (!sale.created_at) return 'N/A';

            const startDate = new Date(sale.created_at);
            const totalPayments = sale.payments?.length || 0;
            const nextPaymentMonth = totalPayments + 1;

            const nextDueDate = new Date(startDate);
            nextDueDate.setMonth(startDate.getMonth() + nextPaymentMonth);

            return nextDueDate.toLocaleDateString();
        } catch (error) {
            return 'N/A';
        }
    };

    const generatePrintContent = (sale, forPDF = false) => {
        const currentDate = new Date().toLocaleDateString();
        const paidAmount = sale.payments && sale.payments.length > 0
            ? sale.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0)
            : 0;

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Installment Sale Details - ${sale.customer?.name || 'N/A'}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    color: #333;
                    line-height: 1.6;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .company-logo {
                    font-size: 24px;
                    font-weight: bold;
                    color: #2c3e50;
                }
                .document-title {
                    font-size: 20px;
                    margin: 10px 0;
                    color: #34495e;
                }
                .print-date {
                    font-size: 12px;
                    color: #666;
                }
                .section {
                    margin-bottom: 25px;
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                }
                .section-title {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 15px;
                    color: #2c3e50;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 5px;
                }
                .info-row {
                    display: flex;
                    margin-bottom: 8px;
                }
                .info-label {
                    font-weight: bold;
                    min-width: 150px;
                    color: #555;
                }
                .info-value {
                    flex: 1;
                }
                .product-image {
                    text-align: center;
                    margin: 15px 0;
                }
                .product-image img {
                    max-width: 150px;
                    max-height: 150px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                }
                .payment-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }
                .payment-table th,
                .payment-table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                .payment-table th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }
                .financial-summary {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    margin-top: 15px;
                }
                .total-amount {
                    font-size: 18px;
                    font-weight: bold;
                    color: #27ae60;
                }
                .remaining-amount {
                    font-size: 16px;
                    font-weight: bold;
                    color: #e74c3c;
                }
                @media print {
                    body { margin: 0; }
                    .section { break-inside: avoid; }
                }
                @page {
                    size: ${printOptions.paperSize};
                    margin: 1in;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-logo">Your Company Name</div>
                <div class="document-title">Installment Sale Agreement</div>
                <div class="print-date">Generated on: ${currentDate}</div>
            </div>

            ${printOptions.includeCustomer ? `
            <div class="section">
                <div class="section-title">Customer Information</div>
                <div class="info-row">
                    <div class="info-label">Full Name:</div>
                    <div class="info-value">${sale.customer?.name || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Address:</div>
                    <div class="info-value">${sale.customer?.address || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Phone Number:</div>
                    <div class="info-value">${sale.customer?.phone || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">CNIC:</div>
                    <div class="info-value">${sale.customer?.cnic || 'N/A'}</div>
                </div>
            </div>
            ` : ''}

            <div class="section">
                <div class="section-title">Product Information</div>
                ${printOptions.includeProductImage ? `
                <div class="product-image">
                    <img src="${sale.product && sale.product.image ? `${fullDomainWithPort}/storage/${sale.product.image}` : `${fullDomainWithPort}/assets/images/no-image.png`}"
                         alt="${sale.product?.name || 'Product'}"
                         onerror="this.src='${fullDomainWithPort}/assets/images/no-image.png'">
                </div>
                ` : ''}
                <div class="info-row">
                    <div class="info-label">Product Name:</div>
                    <div class="info-value">${sale.product?.name || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Product ID:</div>
                    <div class="info-value">${sale.product?.id || 'N/A'}</div>
                </div>
            </div>

            ${printOptions.includeFinancial ? `
            <div class="section">
                <div class="section-title">Financial Details</div>
                <div class="info-row">
                    <div class="info-label">Total Amount:</div>
                    <div class="info-value total-amount">PKR ${sale.total}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Down Payment:</div>
                    <div class="info-value">PKR ${sale.down_payment}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Monthly Installment:</div>
                    <div class="info-value">PKR ${sale.monthly_installment}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Duration:</div>
                    <div class="info-value">${sale.duration} months</div>
                </div>
                ${sale.interest_rate !== undefined ? `
                <div class="info-row">
                    <div class="info-label">Interest Rate:</div>
                    <div class="info-value">${sale.interest_rate}%</div>
                </div>
                ` : ''}
                <div class="financial-summary">
                    <div class="info-row">
                        <div class="info-label">Total Paid:</div>
                        <div class="info-value">PKR ${paidAmount}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Remaining Balance:</div>
                        <div class="info-value remaining-amount">PKR ${sale.remaining_balance}</div>
                    </div>
                </div>
            </div>
            ` : ''}

            ${printOptions.includeGuarantor ? `
            <div class="section">
                <div class="section-title">Guarantor Information</div>
                <div class="info-row">
                    <div class="info-label">Full Name:</div>
                    <div class="info-value">${sale.guarantor?.name || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Address:</div>
                    <div class="info-value">${sale.guarantor?.address || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Phone Number:</div>
                    <div class="info-value">${sale.guarantor?.phone || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">CNIC:</div>
                    <div class="info-value">${sale.guarantor?.cnic || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Relationship:</div>
                    <div class="info-value">${sale.guarantor?.relationship || 'N/A'}</div>
                </div>
            </div>
            ` : ''}

            ${printOptions.includePaymentHistory && sale.payments && sale.payments.length > 0 ? `
            <div class="section">
                <div class="section-title">Payment History</div>
                <table class="payment-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Payment Method</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sale.payments.map(payment => `
                            <tr>
                                <td>${payment.payment_date || 'N/A'}</td>
                                <td>PKR ${payment.amount}</td>
                                <td>${payment.payment_method || 'N/A'}</td>
                                <td>${payment.status || 'Completed'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            <div class="section" style="margin-top: 40px;">
                <div class="section-title">Signatures</div>
                <div style="display: flex; justify-content: space-between; margin-top: 50px;">
                    <div style="text-align: center; width: 200px;">
                        <div style="border-top: 1px solid #333; padding-top: 10px;">
                            Customer Signature
                        </div>
                    </div>
                    <div style="text-align: center; width: 200px;">
                        <div style="border-top: 1px solid #333; padding-top: 10px;">
                            Guarantor Signature
                        </div>
                    </div>
                    <div style="text-align: center; width: 200px;">
                        <div style="border-top: 1px solid #333; padding-top: 10px;">
                            Company Representative
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    };

    if (loading) return <div className="text-center p-5"><i className="fas fa-spinner fa-spin fa-2x"></i></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h3 className="card-title">Installment Sales</h3>
                <button
                    onClick={handlePrintCustomerList}
                    className="btn btn-info"
                >
                    <i className="fas fa-print"></i> Print Customer List
                </button>
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
                                sales.filter(sale => sale.id).map(sale => {
                                    console.log('Rendering sale:', sale);
                                    return (
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
                                                {sale.interest_rate !== undefined && (
                                                    <div><strong>Interest Rate:</strong> {sale.interest_rate}%</div>
                                                )}
                                            </td>
                                            <td>
                                                <div><strong>Name:</strong> {sale.guarantor?.name || 'N/A'}</div>
                                                <div><strong>Address:</strong> {sale.guarantor?.address || 'N/A'}</div>
                                                <div><strong>Phone:</strong> {sale.guarantor?.phone || 'N/A'}</div>
                                                <div><strong>CNIC:</strong> {sale.guarantor?.cnic || 'N/A'}</div>
                                                <div><strong>Relationship:</strong> {sale.guarantor?.relationship || 'N/A'}</div>
                                            </td>
                                            <td>
                                                {sale.id ? (
                                                    <>
                                                        <a href={`/admin/installment-sales/${sale.id}/payments`} className="btn btn-success btn-sm mb-1 w-100">
                                                            <i className="fas fa-money-bill"></i> View - Update Payment
                                                        </a>
                                                        <button
                                                            onClick={() => handlePrint(sale)}
                                                            className="btn btn-primary btn-sm w-100"
                                                        >
                                                            <i className="fas fa-print"></i> Print / PDF
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-danger">Invalid Sale</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center">No installment sales found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Customer List Print Options Modal */}
            {showListPrintModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Print Customer List Options</h5>
                                <button type="button" className="btn-close" onClick={() => setShowListPrintModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h6>Display Options:</h6>
                                        <div className="mb-3">
                                            <label className="form-label">Report Title:</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={listPrintOptions.title}
                                                onChange={(e) => setListPrintOptions({...listPrintOptions, title: e.target.value})}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Group By:</label>
                                            <select
                                                className="form-select"
                                                value={listPrintOptions.groupBy}
                                                onChange={(e) => setListPrintOptions({...listPrintOptions, groupBy: e.target.value})}
                                            >
                                                <option value="none">No Grouping</option>
                                                <option value="salesman">By Salesman</option>
                                                <option value="status">By Status</option>
                                                <option value="dueDate">By Due Date</option>
                                            </select>
                                        </div>
                                        <div className="form-check mb-2">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={listPrintOptions.includeImages}
                                                onChange={(e) => setListPrintOptions({...listPrintOptions, includeImages: e.target.checked})}
                                            />
                                            <label className="form-check-label">Include Product Images</label>
                                        </div>
                                        <div className="form-check mb-2">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={listPrintOptions.includeBalances}
                                                onChange={(e) => setListPrintOptions({...listPrintOptions, includeBalances: e.target.checked})}
                                            />
                                            <label className="form-check-label">Include Balance Details</label>
                                        </div>
                                        <div className="form-check mb-2">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={listPrintOptions.includeDueDates}
                                                onChange={(e) => setListPrintOptions({...listPrintOptions, includeDueDates: e.target.checked})}
                                            />
                                            <label className="form-check-label">Include Due Dates</label>
                                        </div>
                                        <div className="form-check mb-2">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={listPrintOptions.includeContactInfo}
                                                onChange={(e) => setListPrintOptions({...listPrintOptions, includeContactInfo: e.target.checked})}
                                            />
                                            <label className="form-check-label">Include Contact Information</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <h6>Paper Settings:</h6>
                                        <div className="mb-3">
                                            <label className="form-label">Paper Size:</label>
                                            <select
                                                className="form-select"
                                                value={listPrintOptions.paperSize}
                                                onChange={(e) => setListPrintOptions({...listPrintOptions, paperSize: e.target.value})}
                                            >
                                                <option value="A4">A4</option>
                                                <option value="A3">A3</option>
                                                <option value="Letter">Letter</option>
                                                <option value="Legal">Legal</option>
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Orientation:</label>
                                            <select
                                                className="form-select"
                                                value={listPrintOptions.orientation}
                                                onChange={(e) => setListPrintOptions({...listPrintOptions, orientation: e.target.value})}
                                            >
                                                <option value="portrait">Portrait</option>
                                                <option value="landscape">Landscape</option>
                                            </select>
                                        </div>
                                        <div className="alert alert-info">
                                            <small>
                                                <strong>Preview:</strong><br/>
                                                • Total customers: {sales.length}<br/>
                                                • Columns: {7 +
                                                    (listPrintOptions.includeImages ? 1 : 0) +
                                                    (listPrintOptions.includeContactInfo ? 2 : 0) +
                                                    (listPrintOptions.includeBalances ? 2 : 0) +
                                                    (listPrintOptions.includeDueDates ? 1 : 0)}<br/>
                                                • Recommended: Landscape for more columns
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowListPrintModal(false)}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handleListPrintConfirm}>
                                    <i className="fas fa-print"></i> Print Customer List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Individual Sale Print Options Modal */}
            {showPrintModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Print Options - {selectedSale?.customer?.name}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowPrintModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h6>Include Sections:</h6>
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={printOptions.includeCustomer}
                                                onChange={(e) => setPrintOptions({...printOptions, includeCustomer: e.target.checked})}
                                            />
                                            <label className="form-check-label">Customer Information</label>
                                        </div>
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={printOptions.includeGuarantor}
                                                onChange={(e) => setPrintOptions({...printOptions, includeGuarantor: e.target.checked})}
                                            />
                                            <label className="form-check-label">Guarantor Information</label>
                                        </div>
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={printOptions.includeFinancial}
                                                onChange={(e) => setPrintOptions({...printOptions, includeFinancial: e.target.checked})}
                                            />
                                            <label className="form-check-label">Financial Details</label>
                                        </div>
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={printOptions.includePaymentHistory}
                                                onChange={(e) => setPrintOptions({...printOptions, includePaymentHistory: e.target.checked})}
                                            />
                                            <label className="form-check-label">Payment History</label>
                                        </div>
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={printOptions.includeProductImage}
                                                onChange={(e) => setPrintOptions({...printOptions, includeProductImage: e.target.checked})}
                                            />
                                            <label className="form-check-label">Product Image</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <h6>Paper Settings:</h6>
                                        <div className="mb-3">
                                            <label className="form-label">Paper Size:</label>
                                            <select
                                                className="form-select"
                                                value={printOptions.paperSize}
                                                onChange={(e) => setPrintOptions({...printOptions, paperSize: e.target.value})}
                                            >
                                                <option value="A4">A4</option>
                                                <option value="A3">A3</option>
                                                <option value="Letter">Letter</option>
                                                <option value="Legal">Legal</option>
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Orientation:</label>
                                            <select
                                                className="form-select"
                                                value={printOptions.orientation}
                                                onChange={(e) => setPrintOptions({...printOptions, orientation: e.target.value})}
                                            >
                                                <option value="portrait">Portrait</option>
                                                <option value="landscape">Landscape</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPrintModal(false)}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-success" onClick={handleSavePDF}>
                                    <i className="fas fa-file-pdf"></i> Save as PDF
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handlePrintConfirm}>
                                    <i className="fas fa-print"></i> Print
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
