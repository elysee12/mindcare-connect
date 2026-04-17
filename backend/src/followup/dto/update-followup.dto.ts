import { PartialType } from '@nestjs/mapped-types';
import { CreateFollowupDto } from './create-followup.dto';

export class UpdateFollowupDto extends PartialType(CreateFollowupDto) {}
