<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$data = [];
if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    if ($raw) {
        $data = json_decode($raw, true) ?: [];
    } else {
        $data = $_POST;
    }
}

$username = isset($data['username']) ? trim($data['username']) : '';
$password = isset($data['password']) ? $data['password'] : '';

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Se requieren nombre de usuario y contraseña']);
    exit;
}

$user = find_user($username);
if (!$user) {
    echo json_encode(['ok' => false, 'error' => 'Usuario Inexistente']);
    exit;
}


if (hash('sha256', $password) === $user['password']) {
    echo json_encode(['ok' => true, 'user' => ['id' => $user['id'], 'username' => $user['username']]]);
    exit;
} else {
    echo json_encode(['ok' => false, 'error' => 'Credenciales Invalidas']);
    exit;
}
