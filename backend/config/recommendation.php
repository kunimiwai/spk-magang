<?php
return [
    'enabled' => true,
    'kmeans' => [
        'cluster_count' => 2,
        'random_seed' => 42,
        'feature_criterion_ids' => [7, 8, 9],
    ],
    'peminatan_cluster_map' => ["DTA" => [0, 1]],
    'ranking' => [
        'limit' => 10,
    ],
];