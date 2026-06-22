import { PartialType } from '@nestjs/mapped-types';
import { CreateTimeDiscountDto } from './create-time-discount.dto';

export class UpdateTimeDiscountDto extends PartialType(CreateTimeDiscountDto) {}
