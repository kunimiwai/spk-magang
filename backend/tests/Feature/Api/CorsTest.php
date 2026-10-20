<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class CorsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'cors.allowed_origins' => [
                'http://localhost:5173',
                'http://127.0.0.1:5173',
            ],
        ]);
    }

    public function test_configured_frontend_origin_can_call_the_api_from_a_browser(): void
    {
        $this->withHeader('Origin', 'http://localhost:5173')
            ->getJson('/api/health')
            ->assertOk()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    }

    public function test_configured_frontend_origin_can_complete_a_preflight_request(): void
    {
        $response = $this->call('OPTIONS', '/api/health', [], [], [], [
            'HTTP_ORIGIN' => 'http://localhost:5173',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
            'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'authorization,content-type',
        ]);

        $response->assertNoContent();
        $response->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    }

    public function test_unconfigured_origin_is_not_granted_cors_access(): void
    {
        $this->withHeader('Origin', 'https://evil.example')
            ->getJson('/api/health')
            ->assertOk()
            ->assertHeaderMissing('Access-Control-Allow-Origin');

        $response = $this->call('OPTIONS', '/api/health', [], [], [], [
            'HTTP_ORIGIN' => 'https://evil.example',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
            'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'authorization,content-type',
        ]);

        $this->assertFalse($response->headers->has('Access-Control-Allow-Origin'));
    }
}
