import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum WholesaleAction {
  APPROVE = 'approve',
  REJECT  = 'reject',
}

export class WholesaleActionDto {
  @IsEnum(WholesaleAction)
  action: WholesaleAction;

  @IsOptional() @IsString()
  reason?: string;
}
