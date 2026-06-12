import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FrameAttribute, FrameAttributeDocument } from './entities/frame-attribute.schema';
import { CreateFrameAttributeDto } from './dto/create-frame-attribute.dto';
import { UpdateFrameAttributeDto } from './dto/update-frame-attribute.dto';

@Injectable()
export class FrameAttributeService {
  constructor(
    @InjectModel(FrameAttribute.name) private readonly model: Model<FrameAttributeDocument>,
  ) {}

  findActive(type: string): Promise<FrameAttributeDocument[]> {
    return this.model
      .find({ type, isActive: true })
      .sort({ sortOrder: 1, label: 1 })
      .lean<FrameAttributeDocument[]>();
  }

  adminFindAll(type: string): Promise<FrameAttributeDocument[]> {
    return this.model
      .find({ type })
      .sort({ sortOrder: 1, label: 1 })
      .lean<FrameAttributeDocument[]>();
  }

  async create(dto: CreateFrameAttributeDto): Promise<FrameAttributeDocument> {
    const exists = await this.model.findOne({ type: dto.type, value: dto.value });
    if (exists) throw new ConflictException('آیتمی با این شناسه قبلاً ثبت شده');
    return this.model.create(dto);
  }

  async update(id: string, dto: UpdateFrameAttributeDto): Promise<FrameAttributeDocument> {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException('مورد یافت نشد');
    if (dto.value && dto.value !== doc.value) {
      const conflict = await this.model.findOne({ type: doc.type, value: dto.value, _id: { $ne: id } });
      if (conflict) throw new ConflictException('آیتمی با این شناسه قبلاً ثبت شده');
    }
    Object.assign(doc, dto);
    return doc.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.model.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('مورد یافت نشد');
  }
}
