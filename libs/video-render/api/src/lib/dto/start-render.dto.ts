import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class StartRenderDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  fps?: number;
}
