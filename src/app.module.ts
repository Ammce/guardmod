import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { ModeratorModule } from './modules/moderator-text/moderator-text.module';
import { FromCsvModule } from './modules/from-csv/from-csv.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ModeratorModule,
    FromCsvModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
