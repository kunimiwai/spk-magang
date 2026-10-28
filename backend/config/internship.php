<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Acceptance Letter
    |--------------------------------------------------------------------------
    |
    | BPMN only says that an accepted student uploads an acceptance letter.
    | Document format, size limit, document count, and revision/replacement
    | rules are not decided (OD-017, Q41). The values below are technical MVP
    | defaults, not institutional rules. Keep them in this file so they can be
    | changed without touching controllers.
    |
    | - The local disk is private (storage/app/private).
    | - Files are stored with a generated name, never the client filename.
    | - Replacement is disabled until document revision rules are decided.
    | - The effective limit is the lower of max_size_kb and PHP's
    |   upload_max_filesize/post_max_size; see App\Support\UploadLimit.
    |
    */

    'acceptance_letter' => [
        'disk' => 'local',
        'directory' => 'acceptance-letters',
        'max_size_kb' => 5 * 1024,
        'allowed_mime_types' => [
            'application/pdf',
            'image/jpeg',
            'image/png',
        ],
        'replaceable' => false,
    ],

    /*
    |--------------------------------------------------------------------------
    | DPM Placement
    |--------------------------------------------------------------------------
    |
    | DPM candidates are existing user accounts with role "dpm". No lecturer
    | master data or dummy accounts are created. Reassignment is disabled
    | because criteria, approval, and replacement rules are still open
    | (OD-024). Basic placement for accepted applications is supported.
    |
    */

    'dpm' => [
        'allow_reassignment' => false,
    ],

];
