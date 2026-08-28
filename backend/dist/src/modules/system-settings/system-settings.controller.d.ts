import { MemberRole } from '@prisma/client';
import { SystemSettingsService } from './system-settings.service';
import { UpdateTdsStatusDto, TdsStatusResponseDto } from './dto/system-settings.dto';
export declare class SystemSettingsController {
    private readonly systemSettingsService;
    constructor(systemSettingsService: SystemSettingsService);
    getTdsStatus(): Promise<TdsStatusResponseDto>;
    updateTdsStatus(dto: UpdateTdsStatusDto, actorId: string, actorRole: MemberRole): Promise<TdsStatusResponseDto>;
}
