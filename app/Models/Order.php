<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    //
    public function items() {
    return $this->hasMany(OrderItem::class);
}
protected $fillable = [
    'user_id',
    'status',
    'type',
    'total_price'
];
public function user()
{
    return $this->belongsTo(User::class);
}

}
