import { PrismaService } from '../../prisma/prisma.service';
import { HierarchyNode } from './interfaces/hierarchy-node.interface';
export declare class HierarchyService {
    private readonly prisma;
    private readonly ABSOLUTE_MAX_LEVELS_CAP;
    constructor(prisma: PrismaService);
    getDownline(memberId: string, maxLevels?: number): Promise<HierarchyNode[]>;
    getUpline(memberId: string, maxLevels?: number): Promise<HierarchyNode[]>;
}
