import { Controller, Post, Body } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

const moderateCommentContext: OpenAI.Chat.ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content: `
        Analyze the following comment and determine if it contains cyberbullying, harassment, or harmful language.
        Make sure to understand the context, tone and potential impact. 
        Respond with 0 if it is not harmful and 1 if it is harmful.
        Comment is:
      `,
  },
];

interface CsvRow {
  Comment: string;
  Gpt: string;
  Gemini: string;
  Claude: string;
  Human: string;
}

@Controller('run-csv/gpt')
export class GPTCsvController {
  private readonly openai: OpenAI;
  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
      organization: this.configService.get('OPENAI_ORGANIZATION'),
    });
  }

  async moderateComment(comment: string): Promise<number> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [...moderateCommentContext, { role: 'user', content: comment }],
    });

    const content = String(response.choices[0].message.content);
    if (!content) throw new Error('No content in response');

    // Parse the response to get the number (0 or 1)
    const value = parseInt(content.trim());
    if (isNaN(value) || (value !== 0 && value !== 1)) {
      throw new Error(`Invalid response from GPT: ${content}`);
    }

    return value;
  }

  private async processBatch(batch: CsvRow[]): Promise<CsvRow[]> {
    const results = await Promise.all(
      batch.map(async (row) => {
        try {
          const gptValue = await this.moderateComment(row.Comment);
          return { ...row, Gpt: gptValue.toString() };
        } catch (error) {
          console.error(`Error moderating comment: "${row.Comment}"`, error);
          return row;
        }
      }),
    );

    return results;
  }

  private readCsvFile(filePath: string): CsvRow[] {
    let fileContent: string;
    try {
      fileContent = readFileSync(filePath, 'utf8');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to read file: ${errorMessage}`);
    }

    let parsedData: unknown;
    try {
      type ParseOptions = {
        columns: true;
        trim: true;
        skip_empty_lines: true;
      };
      const options: ParseOptions = {
        columns: true as const,
        trim: true as const,
        skip_empty_lines: true as const,
      };
      // Type assertion to ensure parse is treated as a function
      const parseFn = parse as (
        input: string,
        options: ParseOptions,
      ) => unknown;
      parsedData = parseFn(fileContent, options);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse CSV: ${errorMessage}`);
    }

    if (!Array.isArray(parsedData)) {
      throw new Error('CSV parsing did not return an array');
    }

    return parsedData as CsvRow[];
  }

  private async writeCsvFile(filePath: string, rows: CsvRow[]): Promise<void> {
    const header = 'Comment,Gpt,Gemini,Claude,Human\n';
    const content = rows
      .map(
        (row) =>
          `"${row.Comment.replace(/"/g, '""')}",${row.Gpt},${row.Gemini},${row.Claude},${row.Human}`,
      )
      .join('\n');
    await fs.writeFile(filePath, header + content, 'utf8');
  }

  @Post()
  async runCsv() {
    const csvPath = path.join(
      process.cwd(),
      'src',
      'modules',
      'from-csv',
      'csvs',
      'csvExample.csv',
    );

    // Read CSV file
    const records = this.readCsvFile(csvPath);
    const totalComments = records.length;
    const BATCH_SIZE = 5;

    console.log(
      `Starting moderation of ${totalComments} comments in batches of ${BATCH_SIZE}...`,
    );

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let harmfulCount = 0;
    let safeCount = 0;

    // Process in batches
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const batchResults = await this.processBatch(batch);

      // Update statistics
      processedCount += batch.length;
      const progress = ((processedCount / totalComments) * 100).toFixed(1);

      // Count results in this batch
      batchResults.forEach((row) => {
        if (row.Gpt === '1') {
          harmfulCount++;
          successCount++;
        } else if (row.Gpt === '0') {
          safeCount++;
          successCount++;
        } else {
          errorCount++;
        }
      });

      console.log(
        `[${progress}%] Processed ${processedCount}/${totalComments} comments`,
      );
      console.log(
        `Harmful: ${harmfulCount}, Safe: ${safeCount}, Errors: ${errorCount}`,
      );

      // Update records with processed batch
      records.splice(i, batch.length, ...batchResults);

      // Write current progress to file after each batch
      await this.writeCsvFile(csvPath, records);
      console.log(`Updated CSV file with ${processedCount} processed comments`);
    }

    // Final summary
    console.log('\nModeration Complete!');
    console.log('===================');
    console.log(`Total comments processed: ${processedCount}`);
    console.log(`Successfully moderated: ${successCount}`);
    console.log(`Failed to moderate: ${errorCount}`);
    console.log(`Harmful comments found: ${harmfulCount}`);
    console.log(`Safe comments found: ${safeCount}`);
    console.log(
      `Success rate: ${((successCount / totalComments) * 100).toFixed(1)}%`,
    );

    // Show sample of harmful comments
    console.log('\nSample of harmful comments (first 5):');
    const harmfulComments = records
      .filter((row) => row.Gpt === '1')
      .slice(0, 5);

    harmfulComments.forEach((row, index) => {
      console.log(`${index + 1}. "${row.Comment}"`);
    });

    return {
      message: 'CSV moderation complete',
      statistics: {
        totalProcessed: processedCount,
        successfullyModerated: successCount,
        failedToModerate: errorCount,
        harmfulComments: harmfulCount,
        safeComments: safeCount,
        successRate: `${((successCount / totalComments) * 100).toFixed(1)}%`,
      },
      sampleHarmfulComments: harmfulComments.map((row) => ({
        comment: row.Comment,
      })),
    };
  }
}
