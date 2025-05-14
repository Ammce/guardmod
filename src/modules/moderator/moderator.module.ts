import { Module } from '@nestjs/common';
import { ModeratorController } from './moderator.controller';
import { ModeratorService } from './moderator.service';

import { GeminiModule } from '../ai-models/gemini/gemini.module';
import { ClaudeModule } from '../ai-models/claude/claude.module';
import { OpenAiModule } from '../ai-models/open-ai/open-ai.module';

@Module({
  controllers: [ModeratorController],
  providers: [ModeratorService],
  imports: [OpenAiModule, GeminiModule, ClaudeModule],
})
export class ModeratorModule {}
