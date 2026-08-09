import { PrismaService } from '../../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { MemberResponseDto } from './dto/member-response.dto';
export declare class MembersService {
    private readonly prisma;
    private readonly BCRYPT_SALT_ROUNDS;
    constructor(prisma: PrismaService);
    create(createMemberDto: CreateMemberDto): Promise<MemberResponseDto>;
    findById(id: string): Promise<MemberResponseDto>;
    private mapToResponseDto;
}
