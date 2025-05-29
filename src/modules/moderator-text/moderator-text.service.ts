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
    console.log('Moderating comment with options ', { comment, options });
    const models = options?.models || [AvailableModels.GPT_4_1];

    const results: AIModelResponse[] = [];

    for (const model of models) {
      if (modelsMapper.openAI.includes(model)) {
        const result = await this.openAiService.moderateComment(comment, model);
        results.push(result);
      }
      // if (modelsMapper.claude.includes(model)) {
      //   return this.claudeService.moderateComment(comment, options);
      // }
      // if (modelsMapper.gemini.includes(model)) {
      //   return this.geminiService.moderateComment(comment, options);
      // }
    }

    return results;
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
