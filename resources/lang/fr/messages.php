<?php

return [
    'auth' => [
        'invalid_credentials' => 'Email ou mot de passe incorrect.',
        'login_success' => 'Connecté avec succès.',
        'logout_success' => 'Déconnecté avec succès.',
        '2fa_required' => 'Code 2FA requis. Vérifiez votre email et saisissez le code.',
        '2fa_invalid' => 'Le code 2FA est invalide ou expiré.',
        'no_token' => 'Aucun token reçu depuis le serveur.',
        'email_taken' => 'Cet email est déjà enregistré.',
    ],

    'payment' => [
        'success' => 'Paiement réussi',
        'no_method' => 'Aucune méthode de paiement n\'est activée dans les paramètres.',
        'order_not_served' => 'La commande doit être servie avant le paiement. Statut actuel : :status',
        'already_paid' => 'Cette commande a déjà été payée',
        'invalid_method' => 'Méthode de paiement invalide.',
    ],

    'order' => [
        'created' => 'Commande créée avec succès',
        'updated' => 'Commande mise à jour avec succès',
        'deleted' => 'Commande supprimée avec succès',
        'status_updated' => 'Statut de la commande mis à jour à :status',
        'not_found' => 'Commande non trouvée',
        'no_items' => 'La commande doit contenir au moins un élément',
    ],

    'product' => [
        'created' => 'Produit créé avec succès',
        'updated' => 'Produit mis à jour avec succès',
        'deleted' => 'Produit supprimé avec succès',
        'not_found' => 'Produit non trouvé',
        'insufficient_stock' => 'Stock insuffisant pour :product',
    ],

    'category' => [
        'created' => 'Catégorie créée avec succès',
        'updated' => 'Catégorie mise à jour avec succès',
        'deleted' => 'Catégorie supprimée avec succès',
        'not_found' => 'Catégorie non trouvée',
    ],

    'ingredient' => [
        'created' => 'Ingrédient créé avec succès',
        'updated' => 'Ingrédient mis à jour avec succès',
        'deleted' => 'Ingrédient supprimé avec succès',
        'linked' => 'Ingrédient lié avec succès',
        'not_found' => 'Ingrédient non trouvé',
        'insufficient_stock' => 'Stock d\'ingrédient insuffisant : :ingredient',
    ],

    'user' => [
        'created' => 'Utilisateur créé avec succès',
        'updated' => 'Utilisateur mis à jour avec succès',
        'deleted' => 'Utilisateur supprimé avec succès',
        'not_found' => 'Utilisateur non trouvé',
    ],

    'settings' => [
        'updated' => 'Paramètres mis à jour avec succès',
        'error' => 'Erreur lors de la mise à jour des paramètres',
    ],

    'validation' => [
        'required' => 'Le champ :attribute est requis.',
        'email' => 'Le champ :attribute doit être une adresse email valide.',
        'min' => 'Le champ :attribute doit contenir au moins :min caractères.',
        'max' => 'Le champ :attribute ne peut pas dépasser :max caractères.',
        'confirmed' => 'La confirmation du champ :attribute ne correspond pas.',
        'unique' => 'La valeur du champ :attribute existe déjà.',
        'numeric' => 'Le champ :attribute doit être un nombre.',
        'in' => 'La valeur sélectionnée pour :attribute est invalide.',
        'exists' => 'La valeur sélectionnée pour :attribute est invalide.',
    ],

    'status' => [
        'pending' => 'En attente',
        'preparing' => 'En préparation',
        'ready' => 'Prêt',
        'served' => 'Servi',
        'cancelled' => 'Annulé',
        'paid' => 'Payé',
    ],

    'errors' => [
        'server_error' => 'Erreur serveur interne. Veuillez réessayer plus tard.',
        'unauthorized' => 'Accès non autorisé.',
        'forbidden' => 'Accès refusé.',
        'not_found' => 'Ressource non trouvée.',
    ],
];
