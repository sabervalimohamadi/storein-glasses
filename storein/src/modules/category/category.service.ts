import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import slugify from 'slugify';
import { Category, CategoryDocument } from './entities/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private catModel: Model<CategoryDocument>,
  ) {}

  // ── Helpers ───────────────────────────────────────────────────
  private makeSlug(name: string): string {
    return slugify(name, { lower: true, strict: true, locale: 'fa' });
  }

  private async resolveUniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = base;
    let counter = 1;
    while (true) {
      const exists = await this.catModel.findOne({
        slug,
        ...(excludeId && { _id: { $ne: excludeId } }),
      }).lean();
      if (!exists) return slug;
      slug = `${base}-${counter++}`;
    }
  }

  private buildTree(
    cats: CategoryDocument[],
    parentId: string | null = null,
  ): any[] {
    return cats
      .filter((c) => {
        const p = c.parent?.toString() ?? null;
        return p === parentId;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({
        ...c,
        children: this.buildTree(cats, (c._id as any).toString()),
      }));
  }

  // ── Public ────────────────────────────────────────────────────
  async getTree(): Promise<any[]> {
    const cats = await this.catModel
      .find({ isActive: true })
      .select('-__v')
      .sort({ sortOrder: 1 })
      .lean<CategoryDocument[]>();
    return this.buildTree(cats);
  }

  async getRoots(): Promise<CategoryDocument[]> {
    return this.catModel
      .find({ parent: null, isActive: true })
      .select('-__v')
      .sort({ sortOrder: 1 })
      .lean<CategoryDocument[]>();
  }

  async getBySlug(slug: string): Promise<{ category: CategoryDocument; children: CategoryDocument[] }> {
    const category = await this.catModel
      .findOne({ slug, isActive: true })
      .select('-__v')
      .lean<CategoryDocument>();
    if (!category) throw new NotFoundException('دسته‌بندی یافت نشد');

    const children = await this.catModel
      .find({ parent: category._id, isActive: true })
      .select('-__v')
      .sort({ sortOrder: 1 })
      .lean<CategoryDocument[]>();

    return { category, children };
  }

  async getSubtree(categoryId: string): Promise<CategoryDocument[]> {
    return this.catModel
      .find({
        $or: [
          { _id: new Types.ObjectId(categoryId) },
          { ancestors: new Types.ObjectId(categoryId) },
        ],
        isActive: true,
      })
      .select('_id name slug')
      .lean<CategoryDocument[]>();
  }

  // ── Admin CRUD ────────────────────────────────────────────────
  async findAll(): Promise<CategoryDocument[]> {
    return this.catModel
      .find()
      .select('-__v')
      .sort({ depth: 1, sortOrder: 1 })
      .lean<CategoryDocument[]>();
  }

  async findById(id: string): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('شناسه معتبر نیست');
    const cat = await this.catModel.findById(id).select('-__v').lean<CategoryDocument>();
    if (!cat) throw new NotFoundException('دسته‌بندی یافت نشد');
    return cat;
  }

  async create(dto: CreateCategoryDto): Promise<CategoryDocument> {
    let ancestors: Types.ObjectId[] = [];
    let depth = 0;

    if (dto.parent) {
      const parent = await this.catModel.findById(dto.parent).lean<CategoryDocument>();
      if (!parent) throw new NotFoundException('دسته‌بندی والد یافت نشد');
      ancestors = [...parent.ancestors, new Types.ObjectId(dto.parent)];
      depth = parent.depth + 1;
    }

    const baseSlug = dto.slug ? this.makeSlug(dto.slug) : this.makeSlug(dto.name);
    const slug = await this.resolveUniqueSlug(baseSlug);

    const cat = await this.catModel.create({
      ...dto,
      slug,
      ancestors,
      depth,
      parent: dto.parent ? new Types.ObjectId(dto.parent) : null,
    });

    return cat.toObject();
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('شناسه معتبر نیست');

    const existing = await this.catModel.findById(id);
    if (!existing) throw new NotFoundException('دسته‌بندی یافت نشد');

    // Prevent circular parent assignment
    if (dto.parent) {
      if (dto.parent === id)
        throw new BadRequestException('دسته‌بندی نمی‌تواند والد خودش باشد');

      const subtreeIds = (await this.getSubtree(id)).map((c) =>
        (c._id as any).toString(),
      );
      if (subtreeIds.includes(dto.parent))
        throw new BadRequestException('والد نمی‌تواند زیرمجموعه دسته جاری باشد');
    }

    // Recalculate ancestors if parent changed
    const updateData: Partial<CategoryDocument> = { ...dto } as any;

    if (dto.parent !== undefined) {
      if (dto.parent === null || dto.parent === '') {
        updateData.ancestors = [];
        updateData.depth = 0;
        updateData.parent = null;
      } else {
        const parent = await this.catModel.findById(dto.parent).lean<CategoryDocument>();
        if (!parent) throw new NotFoundException('دسته‌بندی والد یافت نشد');
        updateData.ancestors = [...parent.ancestors, new Types.ObjectId(dto.parent)];
        updateData.depth = parent.depth + 1;
        updateData.parent = new Types.ObjectId(dto.parent) as any;
      }
    }

    if (dto.slug || dto.name) {
      const base = dto.slug
        ? this.makeSlug(dto.slug)
        : this.makeSlug(dto.name ?? existing.name);
      updateData.slug = await this.resolveUniqueSlug(base, id);
    }

    const updated = await this.catModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .select('-__v')
      .lean<CategoryDocument>();

    return updated!;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('شناسه معتبر نیست');

    const hasChildren = await this.catModel.exists({ parent: new Types.ObjectId(id) });
    if (hasChildren)
      throw new BadRequestException('ابتدا زیردسته‌ها را حذف کنید');

    const deleted = await this.catModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('دسته‌بندی یافت نشد');
  }
}
