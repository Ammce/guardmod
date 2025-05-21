import { Module } from '@nestjs/common';
import { OpenAiService } from './open-ai.service';
import { OpenAI } from 'openai';

@Module({
  providers: [OpenAiService, OpenAI],
  exports: [OpenAiService],
})
export class OpenAiModule {}
