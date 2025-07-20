// import './bootstrap';
import React from 'react'
import Pos from "./components/Pos";
import Purchase from './components/Purchase/Purchase';
import InstallmentSales from './components/InstallmentSales';
import SalesmanPortal from './components/SalesmanPortal';
import SalesmanAssignment from './components/SalesmanAssignment';
import InstallmentSaleDetail from './components/InstallmentSaleDetail';
import InstallmentPaymentForm from './components/InstallmentPaymentForm';
import SalesmanCustomerPrint from './components/SalesmanCustomerPrint';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// export default function app() {
//   return (
//     <Pos />
//   )
// }

// Check for the 'cart' element and render the 'cart' component using createRoot
if (document.getElementById("cart")) {
    const cartRoot = createRoot(document.getElementById("cart"));
    cartRoot.render(<Pos />);
}

// Check for the 'purchase' element and render the 'Purchase' component using createRoot
if (document.getElementById("purchase")) {
    const purchaseRoot = createRoot(
        document.getElementById("purchase")
    );
    purchaseRoot.render(<Purchase />);
}

// Check for the 'installment-sales' element and render the 'InstallmentSales' component
if (document.getElementById("installment-sales")) {
    const installmentSalesRoot = createRoot(document.getElementById("installment-sales"));
    installmentSalesRoot.render(
        <BrowserRouter>
            <InstallmentSales />
        </BrowserRouter>
    );
}

// Check for the 'salesman-portal' element and render the 'SalesmanPortal' component
if (document.getElementById("salesman-portal")) {
    const salesmanPortalRoot = createRoot(document.getElementById("salesman-portal"));
    salesmanPortalRoot.render(<SalesmanPortal />);
}

// Check for the 'salesman-assignment' element and render the 'SalesmanAssignment' component
if (document.getElementById("salesman-assignment")) {
    const salesmanAssignmentRoot = createRoot(document.getElementById("salesman-assignment"));
    salesmanAssignmentRoot.render(<SalesmanAssignment />);
}

// Check for the 'installment-sale-detail' element and render the 'InstallmentSaleDetail' component
if (document.getElementById("installment-sale-detail")) {
    const installmentSaleDetailRoot = createRoot(document.getElementById("installment-sale-detail"));
    installmentSaleDetailRoot.render(<InstallmentSaleDetail />);
}

// Check for the 'installment-payment' element and render the 'InstallmentPaymentForm' component
if (document.getElementById("installment-payment")) {
    const installmentPaymentRoot = createRoot(document.getElementById("installment-payment"));
    installmentPaymentRoot.render(<InstallmentPaymentForm />);
}

// Check for the 'salesman-customer-print' element and render the 'SalesmanCustomerPrint' component
if (document.getElementById("salesman-customer-print")) {
    const salesmanCustomerPrintRoot = createRoot(document.getElementById("salesman-customer-print"));
    salesmanCustomerPrintRoot.render(<SalesmanCustomerPrint />);
}

