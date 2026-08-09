import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { MemberResponseDto } from './dto/member-response.dto';
export declare class MembersController {
    private readonly membersService;
    constructor(membersService: MembersService);
    create(createMemberDto: CreateMemberDto): Promise<MemberResponseDto>;
    findOne(id: string): Promise<MemberResponseDto>;
}
