import { Injectable } from '@nestjs/common';
import { OpenAiService } from './ai-models/open-ai/open-ai.service';

@Injectable()
export class ModeratorService {
  constructor(private readonly openAiService: OpenAiService) {}

  async moderateComment(comment: string) {
    return this.openAiService.moderateComment(comment);
  }

  async moderatePost(post: string) {
    return this.openAiService.moderatePost(post);
  }

  async moderateMessage(message: string) {
    return this.openAiService.moderateMessage(message);
  }
}
