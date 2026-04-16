<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use Illuminate\Http\Request;

class IngredientController extends Controller
{
    /**
     * List all ingredients
     */
    public function index()
    {
        $ingredients = Ingredient::orderBy('name')->get();

        return response()->json([
            'data' => $ingredients
        ]);
    }

    /**
     * Create a new ingredient
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'quantity' => 'required|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'alert_threshold' => 'required|numeric|min:0',
        ]);

        $name = trim((string) $request->name);
        $unit = trim((string) ($request->unit ?? 'pcs'));

        $duplicate = Ingredient::query()
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
            ->exists();

        if ($duplicate) {
            return response()->json([
                'message' => 'Ingredient already exists with the same name.'
            ], 422);
        }

        $ingredient = Ingredient::create([
            'name' => $name,
            'quantity' => $request->quantity,
            'unit' => $unit,
            'alert_threshold' => $request->alert_threshold,
        ]);

        return response()->json([
            'message' => 'Ingredient created successfully',
            'data' => $ingredient
        ], 201);
    }

    /**
     * Update an ingredient (restock or edit)
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'quantity' => 'sometimes|numeric|min:0',
            'unit' => 'sometimes|string|max:50',
            'alert_threshold' => 'sometimes|numeric|min:0',
        ]);

        $ingredient = Ingredient::findOrFail($id);

        if ($request->has('name') || $request->has('unit')) {
            $targetName = trim((string) ($request->name ?? $ingredient->name));
            $targetUnit = trim((string) ($request->unit ?? $ingredient->unit ?? 'pcs'));

            $duplicate = Ingredient::query()
                ->where('id', '!=', $ingredient->id)
                ->whereRaw('LOWER(name) = ?', [mb_strtolower($targetName)])
                ->exists();

            if ($duplicate) {
                return response()->json([
                    'message' => 'Ingredient already exists with the same name.'
                ], 422);
            }
        }

        // If quantity is being updated, record a stock movement
        if ($request->has('quantity') && $request->quantity != $ingredient->quantity) {
            $diff = $request->quantity - $ingredient->quantity;
            \App\Models\StockMovement::create([
                'ingredient_id' => $ingredient->id,
                'quantity' => abs($diff),
                'type' => $diff > 0 ? 'in' : 'out',
            ]);
        }

        $ingredient->update($request->only(['name', 'quantity', 'unit', 'alert_threshold']));

        return response()->json([
            'message' => 'Ingredient updated successfully',
            'data' => $ingredient
        ]);
    }

    /**
     * Delete an ingredient
     */
    public function destroy($id)
    {
        $ingredient = Ingredient::findOrFail($id);

        $ingredient->delete();

        return response()->json([
            'message' => 'Ingredient deleted successfully'
        ]);
    }
}
