<?php

return [
    'auth' => [
        'invalid_credentials' => 'Invalid email or password.',
        'login_success' => 'Successfully logged in.',
        'logout_success' => 'Logged out successfully.',
        '2fa_required' => '2FA code required. Check your email and enter the code.',
        '2fa_invalid' => '2FA code is invalid or expired.',
        'no_token' => 'No token was returned by the server.',
        'email_taken' => 'This email is already registered.',
    ],

    'payment' => [
        'success' => 'Payment successful',
        'no_method' => 'No payment method is enabled in settings.',
        'order_not_served' => 'Order must be served before payment. Current status: :status',
        'already_paid' => 'This order has already been paid',
        'invalid_method' => 'Invalid payment method.',
    ],

    'order' => [
        'created' => 'Order created successfully',
        'updated' => 'Order updated successfully',
        'deleted' => 'Order deleted successfully',
        'status_updated' => 'Order status updated to :status',
        'not_found' => 'Order not found',
        'no_items' => 'Order must have at least one item',
    ],

    'product' => [
        'created' => 'Product created successfully',
        'updated' => 'Product updated successfully',
        'deleted' => 'Product deleted successfully',
        'not_found' => 'Product not found',
        'insufficient_stock' => 'Insufficient stock for :product',
    ],

    'category' => [
        'created' => 'Category created successfully',
        'updated' => 'Category updated successfully',
        'deleted' => 'Category deleted successfully',
        'not_found' => 'Category not found',
    ],

    'ingredient' => [
        'created' => 'Ingredient created successfully',
        'updated' => 'Ingredient updated successfully',
        'deleted' => 'Ingredient deleted successfully',
        'linked' => 'Ingredient linked successfully',
        'not_found' => 'Ingredient not found',
        'insufficient_stock' => 'Insufficient ingredient stock: :ingredient',
    ],

    'user' => [
        'created' => 'User created successfully',
        'updated' => 'User updated successfully',
        'deleted' => 'User deleted successfully',
        'not_found' => 'User not found',
    ],

    'settings' => [
        'updated' => 'Settings updated successfully',
        'error' => 'Error updating settings',
    ],

    'validation' => [
        'required' => 'The :attribute field is required.',
        'email' => 'The :attribute must be a valid email address.',
        'min' => 'The :attribute must be at least :min characters.',
        'max' => 'The :attribute may not be greater than :max characters.',
        'confirmed' => 'The :attribute confirmation does not match.',
        'unique' => 'The :attribute has already been taken.',
        'numeric' => 'The :attribute must be a number.',
        'in' => 'The selected :attribute is invalid.',
        'exists' => 'The selected :attribute is invalid.',
    ],

    'status' => [
        'pending' => 'Pending',
        'preparing' => 'Preparing',
        'ready' => 'Ready',
        'served' => 'Served',
        'cancelled' => 'Cancelled',
        'paid' => 'Paid',
    ],

    'errors' => [
        'server_error' => 'Internal server error. Please try again later.',
        'unauthorized' => 'Unauthorized access.',
        'forbidden' => 'Access denied.',
        'not_found' => 'Resource not found.',
    ],
];
