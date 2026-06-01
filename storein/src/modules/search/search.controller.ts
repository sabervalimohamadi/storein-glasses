import {
  Controller, Delete, Get, Param,
  Query, UseGuards,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchSuggestDto } from './dto/search-suggest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { UserDocument } from '../user/entities/user.schema';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // ── Public ─────────────────────────────────────────────────
  @Public()
  @Get()
  async search(@Query() dto: SearchQueryDto) {
    return this.searchService.search(dto);
  }

  @Public()
  @Get('suggest')
  suggest(@Query() dto: SearchSuggestDto) {
    return this.searchService.suggest(dto.q);
  }

  // ── Auth (history) ─────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('history')
  getHistory(@CurrentUser() user: UserDocument) {
    return this.searchService.getHistory((user._id as any).toString());
  }

  @UseGuards(JwtAuthGuard)
  @Delete('history')
  clearHistory(@CurrentUser() user: UserDocument) {
    return this.searchService.clearHistory((user._id as any).toString());
  }

  @UseGuards(JwtAuthGuard)
  @Delete('history/:term')
  removeHistoryItem(
    @CurrentUser() user: UserDocument,
    @Param('term') term: string,
  ) {
    return this.searchService.removeHistoryItem(
      (user._id as any).toString(), term,
    );
  }
}
