import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { NoHtml } from '../../../common/validation/no-html.validator';

export class SendChatMessageDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  @NoHtml({
    message:
      'question must not contain HTML markup',
  })
  question!: string;
}