<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::table('customers', function (Blueprint $table) {
        $table->dropUnique('customers_phone_unique'); // drops the unique index on phone
    });
}

public function down()
{
    Schema::table('customers', function (Blueprint $table) {
        $table->unique('phone'); // adds it back if you rollback
    });
}


};
