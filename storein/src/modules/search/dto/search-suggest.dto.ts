import { IsString, MaxLength, MinLength } from 'class-validator';

export class SearchSuggestDto {
  @IsString() @MinLength(2) @MaxLength(50)
  q: string;
}
