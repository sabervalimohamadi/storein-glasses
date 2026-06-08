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

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)   private productModel:   Model<ProductDocument>,
    @InjectModel(Category.name)  private categoryModel:  Model<CategoryDocument>,
    @InjectModel(Color.name)     private colorModel:     Model<ColorDocument>,
  ) {}

  // ── Helpers ───────────────────────────────────────────────────
  private async resolveCategoryId(category: string): Promise<Types.ObjectId | null> {
    if (!category) return null;
    if (Types.ObjectId.isValid(category)) return new Types.ObjectId(category);
    const cat = await this.categoryModel.findOne({ slug: category }).select('_id').lean();
    return cat ? (cat._id as Types.ObjectId) : null;
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
  } {
    const active = variants.filter((v) => v.isActive !== false);
    if (!active.length) return { minPrice: 0, maxPrice: 0, totalStock: 0 };

    const prices = active.map((v) => v.price);
    const totalStock = active.reduce((s, v) => s + (v.stock ?? 0), 0);
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      totalStock,
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
    } = query;

    const filter: Record<string, any> = {
      status: ProductStatus.ACTIVE,
    };

    const catId = category ? await this.resolveCategoryId(category) : null;
    if (catId) filter.category = catId;
    if (minPrice !== undefined) filter.minPrice = { $gte: minPrice };
    if (maxPrice !== undefined) filter.maxPrice = { ...filter.maxPrice, $lte: maxPrice };
    if (inStock) filter.totalStock = { $gt: 0 };

    const sortMap: Record<string, any> = {
      newest:     { createdAt: -1 },
      price_asc:  { minPrice: 1 },
      price_desc: { minPrice: -1 },
      popular:    { soldCount: -1, viewCount: -1 },
      bestseller: { soldCount: -1 },
      discount:   { comparePrice: -1, minPrice: 1 },
    };
    const sortObj = sortMap[sort ?? 'newest'] ?? { createdAt: -1 };

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .select('name slug images thumbnail minPrice maxPrice totalStock avgRating reviewCount category tags createdAt variants')
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
    const { status, category, search, sort, page = 1, limit = 20 } = query;
    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    const catId2 = category ? await this.resolveCategoryId(category) : null;
    if (catId2) filter.category = catId2;
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
      return product.toObject();
    } catch (err: any) {
      if (err.name === 'ValidationError')
        throw new BadRequestException(Object.values(err.errors).map((e: any) => e.message).join(', '));
      throw err;
    }
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('شناسه معتبر نیست');

    const existing = await this.productModel.findById(id);
    if (!existing) throw new NotFoundException('محصول یافت نشد');

    const updateData: any = { ...dto };

    if (dto.name || dto.slug) {
      const base = dto.slug
        ? this.makeSlug(dto.slug)
        : this.makeSlug(dto.name ?? existing.name);
      updateData.slug = await this.uniqueSlug(base, id);
    }

    if (dto.category) updateData.category = new Types.ObjectId(dto.category);

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
    return product.toObject();
  }
}
