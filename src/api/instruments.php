<?php
header('Content-Type: application/json');

$out = [];

$symbols = ['EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'USDCAD'];
foreach ($symbols as $s) {
    // Precios base simulados
    $base = 1.00;
    switch ($s) {
        case 'EURUSD':
            $base = 1.10;
            break;
        case 'USDJPY':
            $base = 2.00;
            break;
        case 'GBPUSD':
            $base = 1.27;
            break;
        case 'AUDUSD':
            $base = 0.68;
            break;
        case 'USDCAD':
            $base = 1.35;
            break;
        default:
            $base = 1.00;
            break;
    }
    $price = $base + (mt_rand(-50, 50) / pow(10, ($base >= 100 ? 2 : 2)));
    $qty = mt_rand(1, 1000);
    $out[] = ['symbol' => $s, 'price' => round($price, 2), 'qty' => $qty];
}


echo json_encode(['type' => 'update', 'instruments' => $out, 'ts' => time() * 1000]);
