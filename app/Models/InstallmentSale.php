<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InstallmentSale extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'customer_id',
        'salesman_id',
        'price',
        'profit',
        'total',
        'down_payment',
        'monthly_installment',
        'duration',
        'status',
    ];

    protected $appends = [
        'remaining_balance',
        'total_paid',
        'payments_count'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function salesman()
    {
        return $this->belongsTo(User::class, 'salesman_id');
    }

    public function guarantor()
    {
        return $this->hasOne(InstallmentGuarantor::class);
    }

    public function payments()
    {
        return $this->hasMany(InstallmentPayment::class);
    }
    
    /**
     * Calculate the remaining balance for the installment sale.
     */
    public function getRemainingBalanceAttribute()
    {
        $totalPaid = $this->down_payment + $this->payments->sum('amount');
        return $this->total - $totalPaid;
    }

    /**
     * Calculate the total paid amount for the installment sale.
     */
    public function getTotalPaidAttribute()
    {
        return $this->down_payment + $this->payments->sum('amount');
    }

    /**
     * Calculate the number of payments made for the installment sale.
     */
    public function getPaymentsCountAttribute()
    {
        return $this->payments->count();
    }
}