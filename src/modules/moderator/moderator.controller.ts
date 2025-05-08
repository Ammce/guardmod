import { Body, Controller, Post } from '@nestjs/common';
import { OpenAiService } from './ai-models/open-ai/open-ai.service';

@Controller('moderator')
export class ModeratorController {
  constructor(private readonly openaiService: OpenAiService) {}
  @Post('comments')
  moderateComment(@Body() { comment }: { comment: string }) {
    console.log('Comment is ', comment);
    return this.openaiService.moderateComment(comment);
  }
}
