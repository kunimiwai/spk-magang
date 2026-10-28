<?php

namespace Tests\Unit;

use App\Support\UploadLimit;
use PHPUnit\Framework\TestCase;

class UploadLimitTest extends TestCase
{
    public function test_effective_limit_uses_the_smallest_positive_value(): void
    {
        $this->assertSame(
            2048,
            UploadLimit::effectiveMaxKb(5120, 2048, 8192),
        );

        $this->assertSame(
            5120,
            UploadLimit::effectiveMaxKb(5120, 6144, 10240),
        );

        $this->assertSame(
            512,
            UploadLimit::effectiveMaxKb(5120, 512, 10240),
        );
    }

    public function test_effective_limit_ignores_unknown_or_unlimited_values(): void
    {
        $this->assertSame(
            5120,
            UploadLimit::effectiveMaxKb(5120, null, 8192),
        );

        $this->assertSame(
            5120,
            UploadLimit::effectiveMaxKb(5120, 0, 8192),
        );

        $this->assertSame(
            1,
            UploadLimit::effectiveMaxKb(0, null, null),
        );
    }

    public function test_php_shorthand_sizes_are_converted_to_kilobytes(): void
    {
        $this->assertSame(512, UploadLimit::parseSizeKb('512K'));
        $this->assertSame(2048, UploadLimit::parseSizeKb('2M'));
        $this->assertSame(1048576, UploadLimit::parseSizeKb('1G'));
        $this->assertSame(2048, UploadLimit::parseSizeKb('2m'));
    }

    public function test_byte_sizes_are_rounded_up_to_kilobytes(): void
    {
        $this->assertSame(1, UploadLimit::parseSizeKb('1024'));
        $this->assertSame(2, UploadLimit::parseSizeKb('1025'));
    }

    public function test_invalid_or_unlimited_sizes_are_unknown(): void
    {
        $this->assertNull(UploadLimit::parseSizeKb(null));
        $this->assertNull(UploadLimit::parseSizeKb(false));
        $this->assertNull(UploadLimit::parseSizeKb(''));
        $this->assertNull(UploadLimit::parseSizeKb('-1'));
        $this->assertNull(UploadLimit::parseSizeKb('0'));
        $this->assertNull(UploadLimit::parseSizeKb('invalid'));
    }
}
