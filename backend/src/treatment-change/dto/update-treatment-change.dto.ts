import { PartialType } from '@nestjs/mapped-types';
import { CreateTreatmentChangeDto } from './create-treatment-change.dto';

export class UpdateTreatmentChangeDto extends PartialType(CreateTreatmentChangeDto) {}
