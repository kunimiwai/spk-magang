<?php

namespace App\Enums;

enum CriterionType: string
{
    case Benefit = 'benefit';
    case Cost = 'cost';

    public function label(): string
    {
        return match ($this) {
            self::Benefit => 'Benefit',
            self::Cost => 'Cost',
        };
    }
}
