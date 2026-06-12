import { IsArray, IsMongoId, IsNumber, Max, Min } from 'class-validator'

export class BulkDiscountDto {
  @IsArray()
  @IsMongoId({ each: true })
  productIds: string[]

  @IsNumber()
  @Min(0)
  @Max(90)
  discountPct: number
}
