import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FrameAttribute, FrameAttributeSchema } from './entities/frame-attribute.schema';
import { FrameAttributeService } from './frame-attribute.service';
import { FrameAttributeController } from './frame-attribute.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: FrameAttribute.name, schema: FrameAttributeSchema }])],
  controllers: [FrameAttributeController],
  providers: [FrameAttributeService],
  exports: [FrameAttributeService],
})
export class FrameAttributeModule {}
