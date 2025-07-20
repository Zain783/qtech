<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('installment_sales', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('salesman_id')->nullable();
            $table->decimal('price', 12, 2);
            $table->decimal('profit', 12, 2);
            $table->decimal('total', 12, 2);
            $table->decimal('down_payment', 12, 2);
            $table->decimal('monthly_installment', 12, 2);
            $table->integer('duration'); // in months
            $table->string('status')->default('active');
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('salesman_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('installment_sales');
    }
}; 