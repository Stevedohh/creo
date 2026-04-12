import { IsString, MaxLength } from 'class-validator';

export class RenameFolderDto {
  @IsString()
  @MaxLength(255)
  name!: string;
}
