<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    /**
     * Return a success response
     */
    protected function successResponse($data = null, $message = null, $statusCode = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }

    /**
     * Return an error response
     */
    protected function errorResponse($message, $errors = null, $statusCode = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $statusCode);
    }

    /**
     * Return a translated success response
     */
    protected function transSuccess($messageKey, $data = null, $replace = [], $statusCode = 200): JsonResponse
    {
        $message = trans("messages.{$messageKey}", $replace);
        return $this->successResponse($data, $message, $statusCode);
    }

    /**
     * Return a translated error response
     */
    protected function transError($messageKey, $replace = [], $errors = null, $statusCode = 400): JsonResponse
    {
        $message = trans("messages.{$messageKey}", $replace);
        return $this->errorResponse($message, $errors, $statusCode);
    }
}
