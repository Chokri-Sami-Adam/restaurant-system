<?php

namespace App\Helpers;

class TranslationHelper
{
    /**
     * Translate a message key
     * Usage: trans_msg('payment.success') or trans_msg('auth.invalid_credentials')
     */
    public static function trans($key, $replace = [], $locale = null)
    {
        return trans("messages.{$key}", $replace, $locale);
    }

    /**
     * Get a specific status translation
     */
    public static function statusTrans($status)
    {
        $statusMap = [
            'pending' => 'messages.status.pending',
            'preparing' => 'messages.status.preparing',
            'ready' => 'messages.status.ready',
            'served' => 'messages.status.served',
            'cancelled' => 'messages.status.cancelled',
            'paid' => 'messages.status.paid',
        ];

        $key = $statusMap[$status] ?? null;
        return $key ? trans($key) : $status;
    }
}
