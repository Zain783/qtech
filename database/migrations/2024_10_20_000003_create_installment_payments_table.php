<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('installment_payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('installment_sale_id');
            $table->decimal('amount', 12, 2);
            $table->date('paid_at');
            $table->string('note')->nullable();
            $table->timestamps();

            $table->foreign('installment_sale_id')->references('id')->on('installment_sales')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('installment_payments');
    }
}; 