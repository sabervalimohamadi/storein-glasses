import {
  Body, Controller, Delete, Get, Param, Patch,
  Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { BlogService }       from './blog.service';
import { CreateBlogDto }     from './dto/create-blog.dto';
import { UpdateBlogDto }     from './dto/update-blog.dto';
import { BlogQueryDto }      from './dto/blog-query.dto';
import { CreateCommentDto }  from './dto/create-comment.dto';
import { JwtAuthGuard }      from '../auth/guards/jwt-auth.guard';
import { AdminGuard }        from '../../common/guards/admin.guard';
import { Public }            from '../../common/decorators/public.decorator';

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

  // ── Likes ─────────────────────────────────────────────────────

  @Post(':id/like')
  toggleLike(@Param('id') id: string, @Req() req: any) {
    return this.blogService.toggleLike(id, req.user._id);
  }

  @Get(':id/like-status')
  getLikeStatus(@Param('id') id: string, @Req() req: any) {
    return this.blogService.getLikeStatus(id, req.user._id);
  }

  // ── Comments ──────────────────────────────────────────────────

  @Public()
  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.blogService.getComments(id);
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @Req() req: any,
  ) {
    return this.blogService.addComment(id, req.user._id, dto.content);
  }

  // ── Admin: comment moderation ─────────────────────────────────

  @Get('comments/pending')
  @UseGuards(AdminGuard)
  getPendingComments() {
    return this.blogService.getPendingComments();
  }

  @Get('comments')
  @UseGuards(AdminGuard)
  getAllComments(
    @Query('page')   page?:   string,
    @Query('limit')  limit?:  string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.blogService.getAllCommentsAdmin({
      page:   page  ? +page  : 1,
      limit:  limit ? +limit : 20,
      status,
      search,
    });
  }

  @Patch('comments/:commentId/approve')
  @UseGuards(AdminGuard)
  approveComment(@Param('commentId') commentId: string) {
    return this.blogService.approveComment(commentId);
  }

  @Delete('comments/:commentId')
  @UseGuards(AdminGuard)
  deleteComment(@Param('commentId') commentId: string) {
    return this.blogService.deleteComment(commentId);
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
