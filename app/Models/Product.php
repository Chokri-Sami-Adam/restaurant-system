<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    //
    public function category() {
    return $this->belongsTo(Category::class);
}
protected $fillable = [
    'name',
    'description',
    'price',
    'category_id',
    'is_available'
];

public function ingredients()
{
    return $this->belongsToMany(Ingredient::class, 'product_ingredients')
                ->withPivot('quantity_used');
}
}
