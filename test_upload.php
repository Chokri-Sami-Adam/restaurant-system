<?php
$token = 'test-token'; // You'll need to get a real token from login
$apiUrl = 'http://127.0.0.1:8000/api/admin/settings';
$imagePath = __DIR__ . '/test_logo.png';

// Get auth token first (login)
$ch = curl_init('http://127.0.0.1:8000/api/login');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'email' => 'admin@example.com',
    'password' => 'password'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$loginData = json_decode($response, true);
if (!isset($loginData['token'])) {
    echo "Login failed. Response: " . $response . "\n";
    exit;
}

$token = $loginData['token'];
echo "Login successful. Token: " . substr($token, 0, 20) . "...\n";

// Now upload the logo
$ch = curl_init($apiUrl);
$cFile = curl_file_create($imagePath, 'image/png');

$postData = [
    'restaurant_logo' => $cFile,
    'restaurant_name' => 'Test Restaurant'
];

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Upload response (HTTP $httpCode):\n";
echo $response . "\n";

// Check if logo.png was created
if (file_exists(__DIR__ . '/storage/app/public/restaurant-logos/logo.png')) {
    $size = filesize(__DIR__ . '/storage/app/public/restaurant-logos/logo.png');
    echo "\n✅ Logo saved successfully! File size: $size bytes\n";
} else {
    echo "\n❌ Logo file was not created\n";
}
?>
