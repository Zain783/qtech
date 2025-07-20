<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('installment_guarantors', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('installment_sale_id');
            $table->string('name');
            $table->string('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('cnic')->nullable();
            $table->string('relationship')->nullable();
            $table->timestamps();

            $table->foreign('installment_sale_id')->references('id')->on('installment_sales')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('installment_guarantors');
    }
}; 