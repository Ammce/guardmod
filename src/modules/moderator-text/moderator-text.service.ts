import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../llm-models/open-ai/open-ai.service';
import { ModeratorTextOptions } from './moderator-text.types';

@Injectable()
export class ModeratorService {
  constructor(private readonly openAiService: OpenAiService) {}

  async moderateComment(comment: string, options?: ModeratorTextOptions) {
    // TODO - Loop thorough models and call the appropriate service and pass the models what to use.
    return this.openAiService.moderateComment(comment, options);
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
