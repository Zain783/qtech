<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\InstallmentSale;
use App\Models\InstallmentPayment;
use App\Models\Order;
use App\Models\OrderTransaction;
use App\Models\User;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class InstallmentSaleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if ($request->wantsJson()) {
            $sales = InstallmentSale::with(['product', 'customer', 'guarantor', 'payments', 'salesman'])->get();
            return response()->json($sales);
        }

        return view('backend.installment.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        if ($request->wantsJson()) {
            $sale = InstallmentSale::with(['product', 'customer', 'guarantor', 'payments', 'salesman'])
                ->find($id);
            if (!$sale) {
                return response()->json(['message' => 'Installment sale not found.'], 404);
            }
            return response()->json($sale);
        }

        return view('backend.installment.detail');
    }

    /**
     * Display the payment form for an installment sale.
     */
    public function payment(string $id)
    {
        $sale = InstallmentSale::with(['product', 'customer', 'guarantor', 'payments', 'salesman'])->find($id);
        return view('backend.installment.payment', compact('sale'));
    }

    /**
     * Display the salesman portal.
     */
    public function salesmanIndex(Request $request)
    {
        if ($request->wantsJson()) {
            $sales = InstallmentSale::with(['product', 'customer', 'guarantor', 'payments'])
                ->where('salesman_id', auth()->id())
                ->get();
            return response()->json($sales);
        }

        return view('backend.salesman.portal');
    }

    /**
     * Display the salesman assignment page.
     */
    public function salesmanAssignment()
    {
        return view('backend.salesman.assignment');
    }

    /**
     * Display the print list for a salesman.
     */
    public function printList(Request $request, string $id)
    {
        if ($request->wantsJson()) {
            $sales = InstallmentSale::with(['product', 'customer'])
                ->where('salesman_id', $id)
                ->get();
            return response()->json($sales);
        }

        return view('backend.salesman.print');
    }

    /**
     * Get all salesmen (users with sales_associate role)
     */
    public function getSalesmen()
    {
        $salesRole = Role::where('name', 'sales_associate')->first();
        if (!$salesRole) {
            return response()->json([]);
        }

        $salesmen = User::role('sales_associate')->get(['id', 'name', 'email']);
        return response()->json($salesmen);
    }

    /**
     * Get all unassigned installment customers
     */
    public function getUnassignedCustomers()
    {
        $unassignedSales = InstallmentSale::with(['customer', 'product'])
            ->whereNull('salesman_id')
            ->get();
        return response()->json($unassignedSales);
    }

    /**
     * Assign salesmen to unassigned customers
     */
    public function assignSalesmen(Request $request)
    {
        $request->validate([
            'salesman_ids' => 'required|array',
            'salesman_ids.*' => 'exists:users,id',
        ]);

        $salesmanIds = $request->input('salesman_ids');
        $unassignedSales = InstallmentSale::whereNull('salesman_id')->get();

        if ($unassignedSales->isEmpty()) {
            return response()->json([
                'message' => 'No unassigned customers found',
                'assignments' => []
            ]);
        }

        // Distribute sales evenly among salesmen
        $salesCount = count($unassignedSales);
        $salesmenCount = count($salesmanIds);
        $salesPerSalesman = ceil($salesCount / $salesmenCount);

        $assignments = [];
        foreach ($salesmanIds as $index => $salesmanId) {
            $start = $index * $salesPerSalesman;
            $end = min(($index + 1) * $salesPerSalesman, $salesCount);

            $assignedCount = 0;
            for ($i = $start; $i < $end; $i++) {
                if (isset($unassignedSales[$i])) {
                    $unassignedSales[$i]->salesman_id = $salesmanId;
                    $unassignedSales[$i]->save();
                    $assignedCount++;
                }
            }

            $assignments[] = [
                'salesman' => User::find($salesmanId),
                'customer_count' => $assignedCount
            ];
        }

        return response()->json([
            'message' => 'Customers assigned successfully',
            'assignments' => $assignments
        ]);
    }

    public function store(Request $request)
    {
        // Validate input (add more rules as needed)
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'customer_name' => 'required|string',
            'customer_phone' => 'required|string',
            'customer_cnic' => 'required|string',
            'details_price' => 'required|numeric',
            'details_interest_rate' => 'required|numeric',
            'details_total' => 'required|numeric',
            'details_down_payment' => 'required|numeric',
            'details_monthly_installment' => 'required|numeric',
            'details_duration' => 'required|integer',
            'guarantor_name' => 'required|string',
            'guarantor_phone' => 'required|string',
            'guarantor_cnic' => 'required|string',
            'guarantor_relationship' => 'required|string',
        ]);

        try {
            // Save or update customer
            $customer = \App\Models\Customer::updateOrCreate(
                ['cnic' => $request->input('customer_cnic')],
                [
                    'name' => $request->input('customer_name'),
                    'address' => $request->input('customer_address'),
                    'phone' => $request->input('customer_phone'), // make sure same phone belongs to this CNIC
                    'cnic' => $request->input('customer_cnic'),
                    'image' => $request->file('customer_image') ? $request->file('customer_image')->store('customers', 'public') : null,
                ]
            );
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json(['message' => 'Database error: ' . $e->getMessage()], 500);
        }

        // Save InstallmentSale
        $sale = \App\Models\InstallmentSale::create([
            'product_id' => $request->input('product_id'),
            'customer_id' => $customer->id,
            'price' => $request->input('details_price'),
            'interest_rate' => $request->input('details_interest_rate'),
            'total' => $request->input('details_total'),
            'down_payment' => $request->input('details_down_payment'),
            'monthly_installment' => $request->input('details_monthly_installment'),
            'duration' => $request->input('details_duration'),
            'status' => 'active',
        ]);

        // Save Guarantor
        \App\Models\InstallmentGuarantor::create([
            'installment_sale_id' => $sale->id,
            'name' => $request->input('guarantor_name'),
            'address' => $request->input('guarantor_address'),
            'phone' => $request->input('guarantor_phone'),
            'cnic' => $request->input('guarantor_cnic'),
            'relationship' => $request->input('guarantor_relationship'),
        ]);

        return response()->json(['message' => 'Installment sale created successfully!']);
    }


    /**
     * Store a payment for an installment sale.
     */
    public function storePayment(Request $request, string $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'notes' => 'nullable|string|max:255',
        ]);

        // Find the installment sale
        $sale = InstallmentSale::findOrFail($id);

        // Check if payment amount exceeds remaining balance
        $remainingBalance = $sale->remaining_balance;
        if ($request->amount > $remainingBalance) {
            return response()->json(['message' => 'Payment amount cannot exceed the remaining balance'], 422);
        }

        // Create the payment record
        $payment = new InstallmentPayment([
            'installment_sale_id' => $id,
            'amount' => $request->amount,
            'note' => $request->notes,
            'paid_at' => now(),
        ]);

        // Save the payment
        $payment->save();

        // Update sale status if fully paid
        if ($sale->remaining_balance <= 0) {
            $sale->status = 'completed';
            $sale->save();
        }

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Payment recorded successfully'], 200);
        } else {
            return redirect()->back()->with('success', 'Payment recorded successfully');
        }
    }

    /**
     * Update an existing installment payment.
     */
    public function updatePayment(Request $request, $paymentId)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'notes' => 'nullable|string|max:255',
        ]);

        $payment = InstallmentPayment::findOrFail($paymentId);
        $sale = $payment->installmentSale;
        $oldAmount = $payment->amount;
        $newAmount = $request->amount;
        $totalPaidExcludingThis = $sale->down_payment + $sale->payments()->where('id', '!=', $paymentId)->sum('amount');
        $remainingBalance = $sale->total - $totalPaidExcludingThis;
        if ($newAmount > $remainingBalance) {
            return response()->json(['message' => 'Payment amount cannot exceed the remaining balance'], 422);
        }
        $payment->amount = $newAmount;
        $payment->note = $request->notes;
        $payment->save();
        // Update sale status if fully paid
        if ($sale->remaining_balance <= 0) {
            $sale->status = 'completed';
            $sale->save();
        }
        return response()->json(['message' => 'Payment updated successfully'], 200);
    }

    /**
     * Delete an installment payment.
     */
    public function deletePayment($paymentId)
    {
        $payment = InstallmentPayment::findOrFail($paymentId);
        $sale = $payment->installmentSale;
        $payment->delete();
        // Optionally update sale status if needed
        if ($sale->remaining_balance > 0 && $sale->status === 'completed') {
            $sale->status = 'active';
            $sale->save();
        }
        return response()->json(['message' => 'Payment deleted successfully'], 200);
    }
}
