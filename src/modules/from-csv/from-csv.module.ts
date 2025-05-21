import { Module } from '@nestjs/common';

import { OpenAiModule } from '../llm-models/open-ai/open-ai.module';
import { GPTCsvController } from './gpt.controller';
import { GeminiCsvController } from './gemini.controller';
import { ClaudeCsvController } from './claude.controller';

@Module({
  imports: [OpenAiModule],
  providers: [],
  controllers: [GPTCsvController, GeminiCsvController, ClaudeCsvController],
})
export class FromCsvModule {}
