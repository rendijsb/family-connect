<?php

declare(strict_types=1);

namespace App\Enums\Families;

enum RelationshipTypeEnum: string
{
    case PARENT = 'parent';
    case CHILD = 'child';
    case SPOUSE = 'spouse';
    case SIBLING = 'sibling';
    case GRANDPARENT = 'grandparent';
    case GRANDCHILD = 'grandchild';
    case AUNT_UNCLE = 'aunt_uncle';
    case NEPHEW_NIECE = 'nephew_niece';
    case COUSIN = 'cousin';
    case IN_LAW = 'in_law';
    case GUARDIAN = 'guardian';
    case OTHER = 'other';
}
