import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

// TODO - Reuse this message everywhere, especially the content that is used as context.
const context: OpenAI.Chat.ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content: `
        Your job is to moderate comments. 
        You will be given a comment and you will need to determine if it is appropriate.
        You will need to return a list of categories that the comment falls into.
        You will also need to return a severity score for each category.
        The severity score will be a number between 0 and 100.
        The higher the severity score, the more severe the comment is.
        The categories are:
        - Spam
        - Hate Speech
        - Sexual Content
        - Violence
        - Self-Harm
        - Bullying
        - Other
        The severity score will be a number between 0 and 100.
        The higher the severity score, the more severe the comment is.
        The response should be in JSON format.
        The response should be in the following format:
        {
            "categories": ["Spam", "Hate Speech"],
            "severity": 50,
            "reason": "The comment is a spam comment."
            "isAcceptable": false
        }
    `,
  },
];

@Injectable()
export class OpenAiService {
  private readonly openai: OpenAI;
  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
      organization: this.configService.get('OPENAI_ORGANIZATION'),
    });
  }
  async moderateComment(comment: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [...context, { role: 'user', content: comment }],
    });

    console.log('Response from ai');
    console.dir(response, { depth: null });
    const content = String(response.choices[0].message.content);
    if (!content) throw new Error('No content in response');
    return JSON.parse(content) as { data: any };
  }
}
