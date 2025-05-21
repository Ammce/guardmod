import { Module } from '@nestjs/common';
import { ModeratorController } from './moderator-text.controller';
import { ModeratorService } from './moderator-text.service';

import { GeminiModule } from '../llm-models/gemini/gemini.module';
import { ClaudeModule } from '../llm-models/claude/claude.module';
import { OpenAiModule } from '../llm-models/open-ai/open-ai.module';

@Module({
  controllers: [ModeratorController],
  providers: [ModeratorService],
  imports: [OpenAiModule, GeminiModule, ClaudeModule],
})
export class ModeratorModule {}
