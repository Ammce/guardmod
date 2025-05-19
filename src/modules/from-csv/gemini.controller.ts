import { Controller, Post, Body } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

const moderateCommentContext = `
    Analyze the following comment and determine if it contains cyberbullying, harassment, or harmful language.
    Make sure to understand the context, tone and potential impact. 
    Do not translate the comment. 
    Respond only with 0 if it is not harmful and 1 if it is harmful. Do not respond with any other text.
    Comment is:
`;

interface CsvRow {
  Comment: string;
  Gpt: string;
  Gemini: string;
  Claude: string;
  Human: string;
}

@Controller('run-csv/gemini')
export class GeminiCsvController {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;

  constructor(private configService: ConfigService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const apiKey = this.configService.get('GOOGLE_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not defined in environment variables');
    }

    // Initialize the Google AI client
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  }

  async moderateComment(comment: string): Promise<number> {
    try {
      // Generate content
      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
      const result = await this.model.generateContent([
        moderateCommentContext,
        comment,
      ]);

      const response = await result.response;
      const content = response.text();
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

      if (!content) {
        throw new Error('No content in response');
      }

      // Parse the response to get the number (0 or 1)
      /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
      const value = parseInt(content.trim());
      /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

      if (isNaN(value) || (value !== 0 && value !== 1)) {
        throw new Error(`Invalid response from Gemini: ${content}`);
      }

      return value;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  private async processBatch(batch: CsvRow[]): Promise<CsvRow[]> {
    const results = await Promise.all(
      batch.map(async (row) => {
        try {
          const geminiValue = await this.moderateComment(row.Comment);
          return { ...row, Gemini: geminiValue.toString() };
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
        if (row.Gemini === '1') {
          harmfulCount++;
          successCount++;
        } else if (row.Gemini === '0') {
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
      .filter((row) => row.Gemini === '1')
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
