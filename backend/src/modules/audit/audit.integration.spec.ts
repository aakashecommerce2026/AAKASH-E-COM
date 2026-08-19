import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberRole } from '@prisma/client';

describe('Admin Audit Logs Integration Test Suite', () => {
  let controller: AuditController;
  let service: AuditService;
  let prisma: any;

  const mockAuditLogs = [
    {
      id: 'log-1',
      actorId: 'mem-1',
      actorRole: MemberRole.ADMIN,
      actionType: 'MEMBER_LOGIN',
      entityType: 'Member',
      entityId: 'mem-1',
      metadata: { memberCode: 'AK1000' },
      createdAt: new Date('2026-08-19T10:00:00.000Z'),
      actor: {
        id: 'mem-1',
        memberCode: 'AK1000',
        name: 'Admin User',
        role: MemberRole.ADMIN,
      },
    },
  ];

  beforeEach(async () => {
    prisma = {
      activityLog: {
        create: jest.fn().mockResolvedValue(mockAuditLogs[0]),
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue(mockAuditLogs),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('1. GET /admin/audit-logs', () => {
    it('should return paginated audit logs', async () => {
      const result = await controller.getAuditLogs({});

      expect(result).toBeDefined();
      expect(result.data.length).toBe(1);
      expect(result.data[0].actionType).toBe('MEMBER_LOGIN');
      expect(result.meta.total).toBe(1);
    });

    it('should filter audit logs by actionType and actorId', async () => {
      await controller.getAuditLogs({
        actionType: 'MEMBER_LOGIN',
        actorId: 'mem-1',
      });

      expect(prisma.activityLog.findMany).toHaveBeenCalled();
    });
  });

  describe('2. AuditService logAction', () => {
    it('should create an activity log entry', async () => {
      const log = await service.logAction({
        actorId: 'mem-1',
        actorRole: MemberRole.ADMIN,
        actionType: 'MEMBER_LOGIN',
        entityType: 'Member',
        entityId: 'mem-1',
      });

      expect(log).toBeDefined();
      expect(prisma.activityLog.create).toHaveBeenCalled();
    });
  });
});
