import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../llm-models/open-ai/open-ai.service';
import { ModeratorTextOptions } from './moderator-text.types';
import {
  AIModelResponse,
  AvailableModels,
  modelsMapper,
} from '../llm-models/ai-models.interface';

@Injectable()
export class ModeratorService {
  constructor(private readonly openAiService: OpenAiService) {}

  async moderateComment(comment: string, options?: ModeratorTextOptions) {
    const models = options?.models || [AvailableModels.GPT_4_1];

    const results = await Promise.all(
      models.map(async (model) => {
        if (modelsMapper.openAI.includes(model)) {
          return this.openAiService.moderateComment(comment, model);
        }
        // Add other model type checks here in the future
        return null;
      }),
    );

    return results.filter(
      (result): result is AIModelResponse => result !== null,
    );
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
