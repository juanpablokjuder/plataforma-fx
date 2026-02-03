<?php
header('Content-Type: application/json');

$body = file_get_contents('php://input');
$data = json_decode($body, true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'JSON inválido']);
    exit;
}

$params = $data['params'] ?? null;
if (!is_array($params)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Faltan parámetros']);
    exit;
}

$invalid = [];
$accepted = [];

foreach ($params as $p) {
    $symbol = $p['symbol'] ?? null;
    $target = $p['target'] ?? null;
    $cqty = $p['cqty'] ?? null;

    if ($symbol === null) {
        $invalid[] = ['symbol' => null, 'reason' => 'missing_symbol'];
        continue;
    }

    if (!is_numeric($target) || floatval($target) <= 0) {
        $invalid[] = ['symbol' => $symbol, 'reason' => 'invalid_target'];
        continue;
    }

    if (!is_numeric($cqty) || intval($cqty) <= 0) {
        $invalid[] = ['symbol' => $symbol, 'reason' => 'invalid_quantity'];
        continue;
    }

    $accepted[] = $symbol;

    $line = date('c') . " " . json_encode([
        'user' => $data['user'] ?? null,
        'symbol' => $symbol,
        'target' => floatval($target),
        'cqty' => intval($cqty),
        'side' => $p['side'] ?? null,
        'ts' => $data['ts'] ?? null
    ]) . "\n";
    @file_put_contents(__DIR__ . '/received_params.log', $line, FILE_APPEND | LOCK_EX);
}

if (count($invalid) > 0) {
    echo json_encode(['status' => 'error', 'invalid' => $invalid, 'accepted' => $accepted]);
    exit;
}

echo json_encode(['status' => 'ok', 'receivedFor' => $accepted]);
