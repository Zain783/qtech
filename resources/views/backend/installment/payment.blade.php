@extends('backend.master')
@section('title', 'Installment Payment')
@section('content')
<div id="installment-payment"></div>
@if(isset($sale))
<script>
    window.installmentSale = @json($sale);
</script>
@endif
@endsection