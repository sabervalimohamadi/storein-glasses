import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import slugify from 'slugify';
import { Product, ProductDocument, ProductStatus } from './entities/product.schema';
import { Category, CategoryDocument } from '../category/entities/category.schema';
import { Color, ColorDocument } from '../color/entities/color.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { BulkDiscountDto } from './dto/bulk-discount.dto';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)   private productModel:   Model<ProductDocument>,
    @InjectModel(Category.name)  private categoryModel:  Model<CategoryDocument>,
    @InjectModel(Color.name)     private colorModel:     Model<ColorDocument>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext('ProductService');
  }

  // ── Helpers ───────────────────────────────────────────────────
  private async resolveCategoryId(category: string): Promise<Types.ObjectId | null> {
    if (!category) return null;
    if (Types.ObjectId.isValid(category)) return new Types.ObjectId(category);
    const cat = await this.categoryModel.findOne({ slug: category }).select('_id').lean();
    return cat ? (cat._id as Types.ObjectId) : null;
  }

  // Returns the category itself + all descendants (uses ancestors index for O(1) lookup)
  private async resolveCategoryIds(category: string): Promise<Types.ObjectId[] | null> {
    const catId = await this.resolveCategoryId(category);
    if (!catId) return null;
    const all = await this.categoryModel
      .find({ $or: [{ _id: catId }, { ancestors: catId }], isActive: true })
      .select('_id')
      .lean();
    return all.map((c) => c._id as Types.ObjectId);
  }

  private makeSlug(name: string): string {
    return slugify(name, { lower: true, strict: true, locale: 'fa' });
  }

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = base;
    let i = 1;
    while (true) {
      const exists = await this.productModel
        .findOne({ slug, ...(excludeId && { _id: { $ne: excludeId } }) })
        .lean();
      if (!exists) return slug;
      slug = `${base}-${i++}`;
    }
  }

  private calcDenormalized(variants: any[]): {
    minPrice: number;
    maxPrice: number;
    totalStock: number;
    maxComparePrice: number;
  } {
    const active = variants.filter((v) => v.isActive !== false);
    if (!active.length) return { minPrice: 0, maxPrice: 0, totalStock: 0, maxComparePrice: 0 };

    const prices = active.map((v) => v.price);
    const totalStock = active.reduce((s, v) => s + (v.stock ?? 0), 0);
    const comparePrices = active.filter((v) => v.comparePrice > 0).map((v) => v.comparePrice);
    const maxComparePrice = comparePrices.length ? Math.max(...comparePrices) : 0;
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      totalStock,
      maxComparePrice,
    };
  }

  // ── Public ────────────────────────────────────────────────────
  async findAll(query: ProductQueryDto): Promise<{
    products: ProductDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      category, minPrice, maxPrice, inStock,
      sort, page = 1, limit = 20,
      gender, frameShape, frameMaterial,
    } = query;

    const filter: Record<string, any> = {
      status: ProductStatus.ACTIVE,
    };

    const catIds = category ? await this.resolveCategoryIds(category) : null;
    if (catIds?.length) filter.category = { $in: catIds };
    if (minPrice !== undefined) filter.minPrice = { $gte: minPrice };
    if (maxPrice !== undefined) filter.maxPrice = { ...filter.maxPrice, $lte: maxPrice };
    if (inStock) filter.totalStock = { $gt: 0 };

    // Gender filter — resolve via category.gender field (includes descendants)
    if (gender) {
      const genders = gender.split(',').map(s => s.trim()).filter(Boolean);
      const genderCats = await this.categoryModel
        .find({ gender: { $in: genders } })
        .select('_id')
        .lean();
      if (genderCats.length) {
        const genderCatIds = genderCats.map(c => c._id as Types.ObjectId);
        const allGenderCats = await this.categoryModel
          .find({ $or: [{ _id: { $in: genderCatIds } }, { ancestors: { $in: genderCatIds } }] })
          .select('_id')
          .lean();
        filter.$and = [...(filter.$and ?? []), { category: { $in: allGenderCats.map(c => c._id) } }];
      } else {
        filter._id = { $exists: false }; // no matching categories → empty result
      }
    }

    // Tag-based filters for frame attributes
    const tagConditions: any[] = [];
    if (frameShape)    tagConditions.push({ tags: { $in: frameShape.split(',').map(s => s.trim()).filter(Boolean) } });
    if (frameMaterial) tagConditions.push({ tags: { $in: frameMaterial.split(',').map(s => s.trim()).filter(Boolean) } });
    if (tagConditions.length) filter.$and = [...(filter.$and ?? []), ...tagConditions];

    // When sorting by discount, only return products that actually have a discount
    if (sort === 'discount') {
      filter.$expr = { $gt: ['$maxComparePrice', '$minPrice'] };
    }

    const sortMap: Record<string, any> = {
      newest:     { createdAt: -1 },
      price_asc:  { minPrice: 1 },
      price_desc: { minPrice: -1 },
      popular:    { soldCount: -1, viewCount: -1 },
      bestseller: { soldCount: -1 },
      discount:   { maxComparePrice: -1, minPrice: 1 },
    };
    const sortObj = sortMap[sort ?? 'newest'] ?? { createdAt: -1 };

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .select('name slug images thumbnail minPrice maxPrice maxComparePrice totalStock avgRating reviewCount category tags specs createdAt variants')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean<ProductDocument[]>(),
      this.productModel.countDocuments(filter),
    ]);

    return { products, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string): Promise<any> {
    const product = await this.productModel
      .findOne({ slug, status: ProductStatus.ACTIVE })
      .select('-__v')
      .populate('category', 'name slug')
      .lean<ProductDocument>();
    if (!product) throw new NotFoundException('محصول یافت نشد');

    // Increment view count (fire and forget)
    this.productModel
      .findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } })
      .exec();

    // Build colorMap: { 'مشکی': '#1a1a1a', ... } from DB Colors collection
    const colorNames = (product.variants ?? [])
      .flatMap((v: any) =>
        (v.attributes ?? []).filter((a: any) => a.key === 'رنگ').map((a: any) => a.value)
      )
      .filter(Boolean);

    let colorMap: Record<string, string> = {};
    if (colorNames.length > 0) {
      const colors = await this.colorModel
        .find({ name: { $in: colorNames } })
        .select('name hex')
        .lean<ColorDocument[]>();
      colorMap = Object.fromEntries(colors.map((c) => [c.name, c.hex]));
    }

    return { ...product, colorMap };
  }

  // ── Admin ─────────────────────────────────────────────────────
  async adminFindAll(query: ProductQueryDto): Promise<{
    products: ProductDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { status, category, brand, search, sort, page = 1, limit = 20 } = query;
    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (brand && Types.ObjectId.isValid(brand))
      filter.brand = { $in: [new Types.ObjectId(brand), brand] };
    const catIds2 = category ? await this.resolveCategoryIds(category) : null;
    if (catIds2?.length) filter.category = { $in: catIds2 };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];

    const sortMap: Record<string, any> = {
      newest:     { createdAt: -1 },
      price_asc:  { minPrice: 1 },
      price_desc: { minPrice: -1 },
    };
    const sortObj = sortMap[sort ?? 'newest'] ?? { createdAt: -1 };

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .select('-__v')
        .populate('category', 'name slug')
        .populate('brand', 'name slug')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean<ProductDocument[]>(),
      this.productModel.countDocuments(filter),
    ]);

    return { products, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('شناسه معتبر نیست');
    const product = await this.productModel
      .findById(id)
      .select('-__v')
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .lean<ProductDocument>();
    if (!product) throw new NotFoundException('محصول یافت نشد');
    return product;
  }

  async create(dto: CreateProductDto): Promise<ProductDocument> {
    const base = dto.slug ? this.makeSlug(dto.slug) : this.makeSlug(dto.name);
    const slug = await this.uniqueSlug(base);
    const denorm = this.calcDenormalized(dto.variants ?? []);

    try {
      const doc: any = {
        ...dto,
        slug,
        category: new Types.ObjectId(dto.category),
        ...(dto.brand && { brand: new Types.ObjectId(dto.brand) }),
        ...denorm,
      };
      const product = await this.productModel.create(doc);
      this.logger.log('Product created', {
        productId: (product._id as any).toString(),
        slug: product.slug,
        totalStock: denorm.totalStock,
      });
      return product.toObject();
    } catch (err: any) {
      if (err.name === 'ValidationError') {
        this.logger.error('Product create validation failed', err, { slug });
        throw new BadRequestException(Object.values(err.errors).map((e: any) => e.message).join(', '));
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('شناسه معتبر نیست');

    const existing = await this.productModel.findById(id);
    if (!existing) throw new NotFoundException('محصول یافت نشد');

    const updateData: any = { ...dto };

    // Only regenerate slug when explicitly provided — never derive from Persian name on update
    if (dto.slug) {
      updateData.slug = await this.uniqueSlug(this.makeSlug(dto.slug), id);
    } else {
      delete updateData.slug; // ensure slug field is never touched without explicit intent
    }

    if (dto.category) updateData.category = new Types.ObjectId(dto.category);
    if (dto.brand && Types.ObjectId.isValid(dto.brand as string))
      updateData.brand = new Types.ObjectId(dto.brand as string);
    else if (dto.brand === ('' as any) || dto.brand === null)
      updateData.brand = undefined;

    if (dto.variants) Object.assign(updateData, this.calcDenormalized(dto.variants));

    const updated = await this.productModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .select('-__v')
      .lean<ProductDocument>();

    return updated!;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('شناسه معتبر نیست');
    const deleted = await this.productModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('محصول یافت نشد');
    this.logger.log('Product removed', { productId: id });
  }

  // ── Variant Management ────────────────────────────────────────
  async addVariant(productId: string, dto: CreateVariantDto): Promise<ProductDocument> {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('محصول یافت نشد');

    const skuExists = product.variants.some((v) => v.sku === dto.sku);
    if (skuExists) throw new BadRequestException(`SKU تکراری است: ${dto.sku}`);

    product.variants.push({ ...dto, _id: new Types.ObjectId() } as any);
    Object.assign(product, this.calcDenormalized(product.variants));
    await product.save();
    return product.toObject();
  }

  async bulkDiscount(dto: BulkDiscountDto): Promise<{ updated: number }> {
    const { productIds, discountPct } = dto;
    const pct = Math.max(0, Math.min(90, discountPct));

    const products = await this.productModel
      .find({ _id: { $in: productIds.map((id) => new Types.ObjectId(id)) } })
      .exec();

    if (pct === 0) {
      this.logger.warn('BulkDiscount: removing discount', { count: products.length });
    } else {
      this.logger.log('BulkDiscount: applying', { pct, count: products.length });
    }

    let updated = 0;
    for (const product of products) {
      product.variants.forEach((v: any) => {
        if (pct === 0) {
          if (v.comparePrice > 0) {
            v.price = v.comparePrice;
            v.comparePrice = 0;
          }
        } else {
          // Always discount from the original price (comparePrice if set, otherwise current price)
          const basePrice = v.comparePrice > 0 ? v.comparePrice : v.price;
          v.comparePrice = basePrice;
          v.price = Math.round(basePrice * (1 - pct / 100));
        }
      });
      // Required: Mongoose does not detect mutations on nested array elements automatically
      product.markModified('variants');
      Object.assign(product, this.calcDenormalized(product.variants as any[]));
      await product.save();
      updated++;
    }

    this.logger.log('BulkDiscount: done', { updated, pct });
    return { updated };
  }

  async updateVariant(
    productId: string,
    variantId: string,
    dto: Partial<CreateVariantDto>,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('محصول یافت نشد');

    const variant = product.variants.find((v) => v._id.toString() === variantId);
    if (!variant) throw new NotFoundException('ویریانت یافت نشد');

    if (dto.sku && dto.sku !== variant.sku) {
      const duplicate = product.variants.some(
        (v) => v.sku === dto.sku && v._id.toString() !== variantId,
      );
      if (duplicate) throw new BadRequestException(`SKU تکراری است: ${dto.sku}`);
    }

    Object.assign(variant, dto);
    Object.assign(product, this.calcDenormalized(product.variants));
    await product.save();
    return product.toObject();
  }

  async removeVariant(productId: string, variantId: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('محصول یافت نشد');

    const idx = product.variants.findIndex((v) => v._id.toString() === variantId);
    if (idx === -1) throw new NotFoundException('ویریانت یافت نشد');

    product.variants.splice(idx, 1);
    Object.assign(product, this.calcDenormalized(product.variants));
    await product.save();
    return product.toObject();
  }

  // ── Inventory ─────────────────────────────────────────────────
  async adjustStock(
    productId: string,
    variantId: string,
    delta: number,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('محصول یافت نشد');

    const variant = product.variants.find((v) => v._id.toString() === variantId);
    if (!variant) throw new NotFoundException('ویریانت یافت نشد');

    const newStock = variant.stock + delta;
    if (newStock < 0) throw new BadRequestException('موجودی کافی نیست');

    variant.stock = newStock;
    Object.assign(product, this.calcDenormalized(product.variants));
    await product.save();

    if (newStock <= 5) {
      this.logger.warn('Low stock', { productId, variantId, stock: newStock });
    }

    return product.toObject();
  }
}
