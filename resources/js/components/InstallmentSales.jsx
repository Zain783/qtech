import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

export default function InstallmentSales() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
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

    const handlePrintConfirm = () => {
        const printWindow = window.open('', '_blank');
        const printContent = generatePrintContent(selectedSale);
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for images to load before printing
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
        
        setShowPrintModal(false);
        toast.success('Print dialog opened successfully');
    };

    const handleSavePDF = async () => {
        try {
            // Create a temporary div for PDF generation
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = generatePrintContent(selectedSale, true);
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            document.body.appendChild(tempDiv);

            // Use browser's print to PDF functionality
            const printWindow = window.open('', '_blank');
            printWindow.document.write(generatePrintContent(selectedSale));
            printWindow.document.close();
            
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                document.body.removeChild(tempDiv);
            }, 500);
            
            setShowPrintModal(false);
            toast.success('PDF save dialog opened. Choose "Save as PDF" in print options.');
        } catch (error) {
            toast.error('Error generating PDF');
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

            {/* Print Options Modal */}
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