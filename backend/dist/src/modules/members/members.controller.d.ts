import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { QueryMembersDto } from './dto/query-members.dto';
import { MemberResponseDto } from './dto/member-response.dto';
export declare class MembersController {
    private readonly membersService;
    constructor(membersService: MembersService);
    create(createMemberDto: CreateMemberDto): Promise<MemberResponseDto>;
    findAll(query: QueryMembersDto): Promise<{
        data: MemberResponseDto[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<MemberResponseDto>;
}
