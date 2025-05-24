import { Controller, Post, Body } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import Anthropic from '@anthropic-ai/sdk';
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

@Controller('run-csv/claude')
export class ClaudeCsvController {
  private readonly anthropic: Anthropic;

  constructor(private configService: ConfigService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const apiKey = this.configService.get('CLAUDE_API_KEY');
    if (!apiKey) {
      throw new Error('CLAUDE_API_KEY is not defined in environment variables');
    }
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
    this.anthropic = new Anthropic({ apiKey });
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
  }

  async moderateComment(comment: string): Promise<number> {
    try {
      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
      const message = await this.anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 10,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: `${moderateCommentContext}\n${comment}`,
          },
        ],
      });

      // Check if we have a valid response
      if (!message || !message.content || !Array.isArray(message.content)) {
        throw new Error('Invalid response structure from Claude API');
      }

      // Get the first content block
      const firstContent = message.content[0];
      if (!firstContent || typeof firstContent !== 'object') {
        throw new Error('Invalid content block in Claude API response');
      }

      // Extract the text content
      const content = 'text' in firstContent ? firstContent.text : null;
      if (!content) {
        throw new Error('No content in response');
      }

      // Parse the response to get the number (0 or 1)
      const value = parseInt(content.trim());
      if (isNaN(value) || (value !== 0 && value !== 1)) {
        throw new Error(`Invalid response from Claude: ${content}`);
      }

      return value;
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw error;
    }
  }

  private async processBatch(batch: CsvRow[]): Promise<CsvRow[]> {
    const results: CsvRow[] = [];

    for (const row of batch) {
      try {
        const claudeValue = await this.moderateComment(row.Comment);
        results.push({ ...row, Claude: claudeValue.toString() });
      } catch (error: unknown) {
        if (
          error &&
          typeof error === 'object' &&
          'status' in error &&
          error.status === 429 &&
          'headers' in error
        ) {
          // Rate limit hit, wait for the reset time
          const headers = error.headers as Headers;
          const retryAfter = headers.get('retry-after');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000; // Default to 60 seconds if no retry-after

          console.log(
            `Rate limit hit. Waiting ${waitTime / 1000} seconds before retrying...`,
          );
          await this.sleep(waitTime);

          // Retry the same comment
          try {
            const claudeValue = await this.moderateComment(row.Comment);
            results.push({ ...row, Claude: claudeValue.toString() });
          } catch (retryError) {
            console.error(
              `Error moderating comment after retry: "${row.Comment}"`,
              retryError,
            );
            results.push(row);
          }
        } else {
          console.error(`Error moderating comment: "${row.Comment}"`, error);
          results.push(row);
        }
      }

      // Add a small delay between individual comments
      await this.sleep(1000); // 1 second between comments
    }

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

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  @Post()
  async runCsv() {
    const csvPath = path.join(
      process.cwd(),
      'src',
      'modules',
      'from-csv',
      'csvs',
      'toModerate.csv',
    );

    // Read CSV file
    const records = this.readCsvFile(csvPath);
    const SKIP_ROWS = 0;
    const recordsToProcess = records.slice(SKIP_ROWS);
    const totalComments = recordsToProcess.length;
    const BATCH_SIZE = 5;

    console.log(
      `Starting moderation of ${totalComments} comments (skipping first ${SKIP_ROWS} rows) in batches of ${BATCH_SIZE}...`,
    );
    console.log(
      'Rate limiting: 50 requests per minute (processing sequentially)',
    );

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let harmfulCount = 0;
    let safeCount = 0;

    // Process in batches
    for (let i = 0; i < recordsToProcess.length; i += BATCH_SIZE) {
      const batch = recordsToProcess.slice(i, i + BATCH_SIZE);
      const batchResults = await this.processBatch(batch);

      // Update statistics
      processedCount += batch.length;
      const progress = ((processedCount / totalComments) * 100).toFixed(1);

      // Count results in this batch
      batchResults.forEach((row) => {
        if (row.Claude === '1') {
          harmfulCount++;
          successCount++;
        } else if (row.Claude === '0') {
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
      records.splice(SKIP_ROWS + i, batch.length, ...batchResults);

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
    const harmfulComments = recordsToProcess
      .filter((row) => row.Claude === '1')
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
