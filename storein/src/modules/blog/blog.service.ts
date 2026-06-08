import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { Blog, BlogDocument, BlogStatus } from './entities/blog.schema';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogQueryDto  } from './dto/blog-query.dto';

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w؀-ۿ-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 100) || `post-${Date.now()}`;
}

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
  ) {}

  async findAll(query: BlogQueryDto, adminMode = false) {
    const page  = Math.max(1, +(query.page  ?? 1));
    const limit = Math.max(1, Math.min(50, +(query.limit ?? 20)));
    const skip  = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (!adminMode) {
      filter.status = BlogStatus.PUBLISHED;
    } else if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      filter.$or = [
        { title:   { $regex: query.search, $options: 'i' } },
        { excerpt: { $regex: query.search, $options: 'i' } },
        { tags:    { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.tag) filter.tags = query.tag;

    const sortMap: Record<string, Record<string, SortOrder>> = {
      newest:  { createdAt: -1 },
      oldest:  { createdAt:  1 },
      popular: { viewCount: -1 },
    };
    const sort = sortMap[query.sortBy ?? 'newest'] ?? { createdAt: -1 };

    const [posts, total] = await Promise.all([
      this.blogModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-content')
        .populate('author', 'firstName lastName phone')
        .lean<BlogDocument[]>(),
      this.blogModel.countDocuments(filter),
    ]);

    return { posts, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string): Promise<BlogDocument> {
    const post = await this.blogModel
      .findOne({ slug, status: BlogStatus.PUBLISHED })
      .populate('author', 'firstName lastName')
      .lean<BlogDocument>();
    if (!post) throw new NotFoundException('پست یافت نشد');
    await this.blogModel.updateOne({ _id: post._id }, { $inc: { viewCount: 1 } });
    return post;
  }

  async findById(id: string): Promise<BlogDocument> {
    const post = await this.blogModel
      .findById(id)
      .populate('author', 'firstName lastName phone')
      .lean<BlogDocument>();
    if (!post) throw new NotFoundException('پست یافت نشد');
    return post;
  }

  async create(dto: CreateBlogDto, authorId: string): Promise<BlogDocument> {
    const base = dto.slug ? dto.slug : slugify(dto.title);
    const slug = await this.uniqueSlug(base);

    const publishedAt =
      dto.status === BlogStatus.PUBLISHED ? new Date() : undefined;

    return this.blogModel.create({
      ...dto,
      slug,
      author: authorId,
      ...(publishedAt ? { publishedAt } : {}),
    });
  }

  async update(id: string, dto: UpdateBlogDto): Promise<BlogDocument> {
    const existing = await this.blogModel.findById(id);
    if (!existing) throw new NotFoundException('پست یافت نشد');

    const update: Record<string, any> = { ...dto };

    if (dto.slug && dto.slug !== existing.slug) {
      update.slug = await this.uniqueSlug(dto.slug, id);
    } else if (dto.title && !dto.slug) {
      const candidate = slugify(dto.title);
      if (candidate !== existing.slug) {
        update.slug = await this.uniqueSlug(candidate, id);
      }
    }

    if (dto.status === BlogStatus.PUBLISHED && !existing.publishedAt) {
      update.publishedAt = new Date();
    }

    const updated = await this.blogModel
      .findByIdAndUpdate(id, update, { new: true })
      .lean<BlogDocument>();
    if (!updated) throw new NotFoundException('پست یافت نشد');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const post = await this.blogModel.findByIdAndDelete(id);
    if (!post) throw new NotFoundException('پست یافت نشد');
  }

  async getPopularTags(limit = 20): Promise<{ tag: string; count: number }[]> {
    const result = await this.blogModel.aggregate([
      { $match: { status: BlogStatus.PUBLISHED } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, tag: '$_id', count: 1 } },
    ]);
    return result;
  }

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = base;
    let i    = 1;
    for (;;) {
      const q: Record<string, any> = { slug };
      if (excludeId) q._id = { $ne: excludeId };
      const exists = await this.blogModel.exists(q);
      if (!exists) return slug;
      slug = `${base}-${i++}`;
    }
  }
}
