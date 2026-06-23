import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product, ProductSchema } from './entities/product.schema';
import { Category, CategorySchema } from '../category/entities/category.schema';
import { Color, ColorSchema } from '../color/entities/color.schema';
import { DiscountsModule } from '../../discounts/discounts.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name,  schema: ProductSchema  },
      { name: Category.name, schema: CategorySchema },
      { name: Color.name,    schema: ColorSchema    },
    ]),
    DiscountsModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService, MongooseModule],
})
export class ProductModule {}
