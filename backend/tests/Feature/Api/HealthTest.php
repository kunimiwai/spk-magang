<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_endpoint_reports_the_backend_service(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertExactJson([
                'success' => true,
                'message' => 'SPK Magang API is running',
                'service' => 'backend',
            ]);
    }
}
