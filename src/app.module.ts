import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ModeratorModule } from './modules/moderator/moderator.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ModeratorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
