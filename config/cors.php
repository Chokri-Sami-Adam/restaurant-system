<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure CORS settings for your application. This
    | determines which cross-origin requests are allowed.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
    ],

    'allowed_origins_patterns' => [
        '/^http:\/\/localhost:\d+$/',
        '/^http:\/\/127\.0\.0\.1:\d+$/',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
