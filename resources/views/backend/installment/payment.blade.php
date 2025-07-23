@extends('backend.master')
@section('title', 'Installment Payment')
@section('content')
<div class="container mt-4">
    <h2>Installment Payment Details</h2>
    @if(session('success'))
        <div class="alert alert-success">{{ session('success') }}</div>
    @endif
    @if(isset($sale))
        <div class="card mb-4">
            <div class="card-header bg-info text-white">Customer & Product Info</div>
            <div class="card-body">
                <div><strong>Customer:</strong> {{ $sale->customer->name }}</div>
                <div><strong>Phone:</strong> {{ $sale->customer->phone }}</div>
                <div><strong>Product:</strong> {{ $sale->product->name }}</div>
                <div><strong>Total Amount:</strong> {{ $sale->total }}</div>
            </div>
        </div>
        <div class="card mb-4">
            <div class="card-header bg-warning text-dark">Payment Summary</div>
            <div class="card-body">
                <div><strong>Monthly Installment:</strong> {{ $sale->monthly_installment }}</div>
                <div><strong>Down Payment:</strong> {{ $sale->down_payment }}</div>
                <div><strong>Total Paid:</strong> {{ $sale->payments->sum('amount') + $sale->down_payment }}</div>
                <div><strong>Remaining Balance:</strong> {{ $sale->remaining_balance }}</div>
            </div>
        </div>
        <div class="card mb-4">
            <div class="card-header">Previous Payments</div>
            <div class="card-body">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Amount</th>
                            <th>Notes</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($sale->payments as $idx => $p)
                            <tr>
                                <td>{{ $idx + 1 }}</td>
                                <td>{{ $p->amount }}</td>
                                <td>{{ $p->note }}</td>
                                <td>{{ $p->paid_at }}</td>
                            </tr>
                        @empty
                            <tr><td colspan="4" class="text-center">No payments yet.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
        <div class="card mb-4">
            <div class="card-header">Add Payment Installment</div>
            <div class="card-body">
                <form method="POST" action="{{ url('admin/installment-sales/' . $sale->id . '/payments') }}">
                    @csrf
                    <div class="form-group mb-2">
                        <label for="amount">Amount</label>
                        <input type="number" step="0.01" min="1" class="form-control" id="amount" name="amount" required>
                    </div>
                    <div class="form-group mb-2">
                        <label for="notes">Notes (optional)</label>
                        <input type="text" class="form-control" id="notes" name="notes">
                    </div>
                    <button type="submit" class="btn btn-primary">Add Payment</button>
                </form>
            </div>
        </div>
    @else
        <div class="alert alert-warning">Sale not found</div>
    @endif
</div>
@endsection