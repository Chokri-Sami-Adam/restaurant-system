<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = [
        'ingredient_id',
        'quantity',
        'type',
    ];

    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }
}
