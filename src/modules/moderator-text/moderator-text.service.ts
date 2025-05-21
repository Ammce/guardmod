import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../llm-models/open-ai/open-ai.service';

@Injectable()
export class ModeratorService {
  constructor(private readonly openAiService: OpenAiService) {}

  async moderateComment(comment: string) {
    return this.openAiService.moderateComment(comment);
  }

  async moderateComments(comments: string[]) {
    return this.openAiService.moderateComments(comments);
  }

  async moderatePost(post: string) {
    return this.openAiService.moderatePost(post);
  }

  async moderateMessage(message: string) {
    return this.openAiService.moderateMessage(message);
  }

  async moderateImage(image: string) {
    return this.openAiService.moderateImage(image);
  }
}
