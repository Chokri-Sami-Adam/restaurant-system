<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductIngredientController extends Controller
{
    public function attach(Request $request, $id)
    {
        $request->validate([
            'ingredients' => 'sometimes|array',
            'ingredients.*.id' => 'required|exists:ingredients,id',
            'ingredients.*.quantity' => 'required|integer|min:1'
        ]);

        $product = Product::findOrFail($id);

        $data = [];

        foreach (($request->ingredients ?? []) as $ingredient) {
            $data[$ingredient['id']] = [
                'quantity_used' => $ingredient['quantity']
            ];
        }

        // attach ingredients to product
        $product->ingredients()->sync($data);

        return response()->json([
            'message' => 'Ingredients attached successfully'
        ]);
    }
}
