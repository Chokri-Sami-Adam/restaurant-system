<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ingredient extends Model
{
    protected $fillable = [
        'name',
        'quantity',
        'unit',
        'alert_threshold',
    ];

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_ingredients')
                    ->withPivot('quantity_used');
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }
}
