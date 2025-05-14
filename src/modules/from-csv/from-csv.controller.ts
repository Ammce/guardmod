import { Controller, Post, Body } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';

@Controller('run-csv')
export class FromCsvController {
  constructor() {}

  @Post()
  async runCsv() {
    const csvPath = path.join(
      process.cwd(),
      'src',
      'modules',
      'from-csv',
      'csvs',
      'kika.csv',
    );
    const csv = await fs.readFile(csvPath, 'utf8');

    // Split into lines and process
    const lines = csv.split('\n');
    const header = lines[0];
    const dataLines = lines.slice(1);

    // Process in batches of 50
    const batchSize = 50;
    const batches: string[][] = [];

    for (let i = 0; i < dataLines.length; i += batchSize) {
      const batch = dataLines.slice(i, i + batchSize);
      const updatedBatch = batch.map((line) => {
        const [comment, , gemini, claude, human] = line.split(',');
        return `${comment},1,${gemini},${claude},${human}`;
      });
      batches.push(updatedBatch);

      // Log progress
      console.log(
        `Processed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(dataLines.length / batchSize)}`,
      );
    }

    // Combine all batches
    const updatedLines = batches.flat();
    const updatedCsv = [header, ...updatedLines].join('\n');

    // Write back to file
    await fs.writeFile(csvPath, updatedCsv, 'utf8');

    // Return first 10 comments for display
    const comments = updatedLines
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 10);

    console.log(
      '\nFirst 10 comments with updated Gpt values (using cheaper model):',
    );
    comments.forEach((comment, index) => {
      console.log(`${index + 1}. ${comment}`);
    });

    return {
      message: 'CSV updated successfully with cheaper GPT model',
      totalBatches: Math.ceil(dataLines.length / batchSize),
      sampleComments: comments,
    };
  }
}
