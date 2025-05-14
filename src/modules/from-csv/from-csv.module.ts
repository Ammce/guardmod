import { Module } from '@nestjs/common';
import { FromCsvController } from './from-csv.controller';

@Module({
  providers: [],
  controllers: [FromCsvController],
})
export class FromCsvModule {}
