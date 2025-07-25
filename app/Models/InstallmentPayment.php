<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InstallmentPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'installment_sale_id',
        'amount',
        'paid_at',
        'note',
    ];

    public function installmentSale()
    {
        return $this->belongsTo(InstallmentSale::class);
    }
} 