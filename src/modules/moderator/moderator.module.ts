import { Module } from '@nestjs/common';
import { ModeratorController } from './moderator.controller';
import { ModeratorService } from './moderator.service';
import { OpenAiModule } from './aiModels/open-ai/open-ai.module';
import { GeminiModule } from './aiModels/gemini/gemini.module';
import { ClaudeModule } from './aiModels/claude/claude.module';

@Module({
  controllers: [ModeratorController],
  providers: [ModeratorService],
  imports: [OpenAiModule, GeminiModule, ClaudeModule],
})
export class ModeratorModule {}
