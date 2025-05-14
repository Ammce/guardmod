import { Module } from '@nestjs/common';

import { OpenAiModule } from '../ai-models/open-ai/open-ai.module';
import { GPTCsvController } from './gpt.controller';
import { GeminiCsvController } from './gemini.controller';

@Module({
  imports: [OpenAiModule],
  providers: [],
  controllers: [GPTCsvController, GeminiCsvController],
})
export class FromCsvModule {}
