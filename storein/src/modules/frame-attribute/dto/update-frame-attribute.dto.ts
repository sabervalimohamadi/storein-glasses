import { PartialType } from '@nestjs/mapped-types';
import { CreateFrameAttributeDto } from './create-frame-attribute.dto';

export class UpdateFrameAttributeDto extends PartialType(CreateFrameAttributeDto) {}
