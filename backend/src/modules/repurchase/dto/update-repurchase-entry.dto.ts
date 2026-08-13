import { PartialType } from '@nestjs/swagger';
import { CreateRepurchaseEntryDto } from './create-repurchase-entry.dto';

export class UpdateRepurchaseEntryDto extends PartialType(CreateRepurchaseEntryDto) {}
