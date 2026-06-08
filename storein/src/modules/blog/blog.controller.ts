import {
  Body, Controller, Delete, Get, Param, Patch,
  Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { BlogService }     from './blog.service';
import { CreateBlogDto }   from './dto/create-blog.dto';
import { UpdateBlogDto }   from './dto/update-blog.dto';
import { BlogQueryDto }    from './dto/blog-query.dto';
import { JwtAuthGuard }    from '../auth/guards/jwt-auth.guard';
import { AdminGuard }      from '../../common/guards/admin.guard';
import { Public }          from '../../common/decorators/public.decorator';

@Controller('blog')
@UseGuards(JwtAuthGuard)
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // ── Public endpoints ──────────────────────────────────────────
  @Public()
  @Get()
  findAll(@Query() query: BlogQueryDto) {
    return this.blogService.findAll(query);
  }

  @Public()
  @Get('tags')
  getPopularTags() {
    return this.blogService.getPopularTags();
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  // ── Admin endpoints ───────────────────────────────────────────
  @Get('admin')
  @UseGuards(AdminGuard)
  findAllAdmin(@Query() query: BlogQueryDto) {
    return this.blogService.findAll(query, true);
  }

  @Get('admin/:id')
  @UseGuards(AdminGuard)
  findById(@Param('id') id: string) {
    return this.blogService.findById(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() dto: CreateBlogDto, @Req() req: any) {
    return this.blogService.create(dto, req.user._id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateBlogDto) {
    return this.blogService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }
}
