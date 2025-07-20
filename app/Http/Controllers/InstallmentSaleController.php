<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\InstallmentSale;
use App\Models\InstallmentGuarantor;
use App\Models\Customer;
use Illuminate\Http\Request;

class InstallmentSaleController extends Controller
{
    public function store(Request $request)
    {
        // Validate and save customer
        $customer = Customer::updateOrCreate(
            ['cnic' => $request->input('customer_cnic')],
            [
                'name' => $request->input('customer_name'),
                'address' => $request->input('customer_address'),
                'phone' => $request->input('customer_phone'),
                'cnic' => $request->input('customer_cnic'),
                'image' => $request->file('customer_image') ? $request->file('customer_image')->store('customers', 'public') : null,
            ]
        );

        // Save InstallmentSale
        $sale = InstallmentSale::create([
            'product_id' => $request->input('product_id'),
            'customer_id' => $customer->id,
            'price' => $request->input('details_price'),
            'profit' => $request->input('details_profit'),
            'total' => $request->input('details_total'),
            'down_payment' => $request->input('details_down_payment'),
            'monthly_installment' => $request->input('details_monthly_installment'),
            'duration' => $request->input('details_duration'),
            'status' => 'active',
        ]);

        // Save Guarantor
        InstallmentGuarantor::create([
            'installment_sale_id' => $sale->id,
            'name' => $request->input('guarantor_name'),
            'address' => $request->input('guarantor_address'),
            'phone' => $request->input('guarantor_phone'),
            'cnic' => $request->input('guarantor_cnic'),
            'relationship' => $request->input('guarantor_relationship'),
        ]);

        return response()->json(['message' => 'Installment sale created successfully!']);
    }

    public function index(Request $request)
    {
        // Admin: show all
        $sales = InstallmentSale::with(['product', 'customer', 'guarantor', 'payments'])->get();
        return view('backend.installment_sales.index', compact('sales'));
    }

    public function salesmanIndex(Request $request)
    {
        // Salesman: show only assigned
        $sales = InstallmentSale::with(['product', 'customer', 'guarantor', 'payments'])
            ->where('salesman_id', auth()->id())
            ->get();
        return view('backend.installment_sales.salesman', compact('sales'));
    }

    // Add methods for assignment and printing as needed
}
