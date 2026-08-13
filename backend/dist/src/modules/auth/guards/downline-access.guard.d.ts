import { CanActivate, ExecutionContext } from '@nestjs/common';
import { HierarchyService } from '../../hierarchy/hierarchy.service';
export declare class DownlineAccessGuard implements CanActivate {
    private readonly hierarchyService;
    constructor(hierarchyService: HierarchyService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
