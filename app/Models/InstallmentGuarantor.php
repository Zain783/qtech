<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InstallmentGuarantor extends Model
{
    use HasFactory;

    protected $fillable = [
        'installment_sale_id',
        'name',
        'address',
        'phone',
        'cnic',
        'relationship',
    ];

    public function installmentSale()
    {
        return $this->belongsTo(InstallmentSale::class);
    }
} 