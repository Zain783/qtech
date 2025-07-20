import React, { useState } from "react";

export default function InstallmentForm({ product, onSubmit, onCancel }) {
    const [customer, setCustomer] = useState({
        name: "",
        address: "",
        phone: "",
        cnic: "",
        image: null,
    });
    const [guarantor, setGuarantor] = useState({
        name: "",
        address: "",
        phone: "",
        cnic: "",
        relationship: "",
    });
    const [details, setDetails] = useState({
        price: product?.price || 0,
        profit: 0,
        total: product?.price || 0,
        down_payment: 0,
        monthly_installment: 0,
        duration: 12,
    });
    // Update total when price or profit changes
    React.useEffect(() => {
        setDetails((prev) => ({
            ...prev,
            total: parseFloat(prev.price) + parseFloat(prev.profit || 0),
        }));
    }, [details.price, details.profit]);

    const handleCustomerChange = (e) => {
        const { name, value, files } = e.target;
        setCustomer((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };
    const handleGuarantorChange = (e) => {
        const { name, value } = e.target;
        setGuarantor((prev) => ({ ...prev, [name]: value }));
    };
    const handleDetailsChange = (e) => {
        const { name, value } = e.target;
        setDetails((prev) => ({ ...prev, [name]: value }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ customer, guarantor, details });
    };
    return (
        <form onSubmit={handleSubmit}>
            <h5>Customer Information</h5>
            <div className="row">
                <div className="col-md-6 mb-2">
                    <input type="text" className="form-control" name="name" placeholder="Name" value={customer.name} onChange={handleCustomerChange} required />
                </div>
                <div className="col-md-6 mb-2">
                    <input type="text" className="form-control" name="address" placeholder="Address" value={customer.address} onChange={handleCustomerChange} />
                </div>
                <div className="col-md-6 mb-2">
                    <input type="text" className="form-control" name="phone" placeholder="Phone" value={customer.phone} onChange={handleCustomerChange} required />
                </div>
                <div className="col-md-6 mb-2">
                    <input type="text" className="form-control" name="cnic" placeholder="CNIC" value={customer.cnic} onChange={handleCustomerChange} required />
                </div>
                <div className="col-md-6 mb-2">
                    <input type="file" className="form-control" name="image" accept="image/*" onChange={handleCustomerChange} />
                </div>
            </div>
            <h5>Guarantor Information</h5>
            <div className="row">
                <div className="col-md-6 mb-2">
                    <input type="text" className="form-control" name="name" placeholder="Name" value={guarantor.name} onChange={handleGuarantorChange} required />
                </div>
                <div className="col-md-6 mb-2">
                    <input type="text" className="form-control" name="address" placeholder="Address" value={guarantor.address} onChange={handleGuarantorChange} />
                </div>
                <div className="col-md-6 mb-2">
                    <input type="text" className="form-control" name="phone" placeholder="Phone" value={guarantor.phone} onChange={handleGuarantorChange} required />
                </div>
                <div className="col-md-6 mb-2">
                    <input type="text" className="form-control" name="cnic" placeholder="CNIC" value={guarantor.cnic} onChange={handleGuarantorChange} required />
                </div>
                <div className="col-md-6 mb-2">
                    <input type="text" className="form-control" name="relationship" placeholder="Relationship" value={guarantor.relationship} onChange={handleGuarantorChange} required />
                </div>
            </div>
            <h5>Installment Details</h5>
            <div className="row">
                <div className="col-md-4 mb-2">
                    <input type="number" className="form-control" name="price" placeholder="Product Price" value={details.price} onChange={handleDetailsChange} required />
                </div>
                <div className="col-md-4 mb-2">
                    <input type="number" className="form-control" name="profit" placeholder="Profit" value={details.profit} onChange={handleDetailsChange} required />
                </div>
                <div className="col-md-4 mb-2">
                    <input type="number" className="form-control" name="total" placeholder="Total Amount" value={details.total} readOnly />
                </div>
                <div className="col-md-4 mb-2">
                    <input type="number" className="form-control" name="down_payment" placeholder="Down Payment" value={details.down_payment} onChange={handleDetailsChange} required />
                </div>
                <div className="col-md-4 mb-2">
                    <input type="number" className="form-control" name="monthly_installment" placeholder="Monthly Installment" value={details.monthly_installment} onChange={handleDetailsChange} required />
                </div>
                <div className="col-md-4 mb-2">
                    <input type="number" className="form-control" name="duration" placeholder="Duration (months)" value={details.duration} onChange={handleDetailsChange} required />
                </div>
            </div>
            <div className="mt-3 d-flex justify-content-end">
                <button type="button" className="btn btn-secondary mr-2" onClick={onCancel}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit</button>
            </div>
        </form>
    );
} 