/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ModeratorTextOptions } from 'src/modules/moderator-text/moderator-text.types';
import { AiModel, AIModelResponse } from '../ai-models.interface';

// TODO - Reuse this message everywhere, especially the content that is used as context.
const moderateCommentContext: OpenAI.Chat.ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content: `
      You are an AI content moderator. Your task is to analyze the following comment and determine whether it contains any inappropriate or harmful content.
      You must assess the context, tone, intent, and potential impact of the comment—not just specific keywords. Consider whether the comment could reasonably be interpreted as harmful, even if it's sarcastic, indirect, or uses coded language.
      You must return a list of applicable categories. For each category, include:
      - The name of the category
      - A severity score between 0 and 100 (higher means more severe)
      - A brief reason explaining why the comment was classified into that category

      Categories to consider:
      - Spam
      - Hate Speech
      - Sexual Content
      - Violence
      - Self-Harm
      - Bullying
      - Other (for harmful content that doesn't fit the above)

      Additionally, provide:
      - isAcceptable: true or false — depending on whether the comment is appropriate for public display
      - isAcceptableReason: a short explanation for why the comment is or isn’t acceptable, based on the categories and their severity

      The response must be in the following JSON format:
      {
        "categories": [
            {
              "name": "Bullying",
              "severity": 80,
              "reason": "This comment includes targeted personal insults intended to harm."
            }
          ],
          "isAcceptable": false,
          "isAcceptableReason": "The comment contains bullying language with high severity."
        }
       Now, here is the comment to analyze:
    `,
  },
];

const moderateCommentsContext: OpenAI.Chat.ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content: `
      You are an AI content moderator. Your task is to analyze the following comments and determine whether it contains any inappropriate or harmful content.
      You must assess the context, tone, intent, and potential impact of the comment—not just specific keywords. Consider whether the comment could reasonably be interpreted as harmful, even if it's sarcastic, indirect, or uses coded language.
      You must return a list of comments and the categories they fall into.
      For each comment, include:
      - The comment
      For each category, include:
      - The name of the category
      - A severity score between 0 and 100 (higher means more severe)
      - A brief reason explaining why the comment was classified into that category

      Categories to consider:
      - Spam
      - Hate Speech
      - Sexual Content
      - Violence
      - Self-Harm
      - Bullying
      - Other (for harmful content that doesn't fit the above)

      Additionally, provide:
      - isAcceptable: true or false — depending on whether the comment is appropriate for public display
      - isAcceptableReason: a short explanation for why the comment is or isn’t acceptable, based on the categories and their severity

      The response must be in the following JSON format:
      {
        "comments": [
            {
              "comment": "This comment includes targeted personal insults intended to harm.",
              "categories": [
                {
                  "name": "Bullying",
                  "severity": 80,
                  "reason": "This comment includes targeted personal insults intended to harm."
                }
              ],
              "isAcceptable": false,
              "isAcceptableReason": "The comment contains bullying language with high severity."
            }
          ],
        }
       
       Here is the list of comments to analyze:
    `,
  },
];

const moderatePostContext: OpenAI.Chat.ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content: `
        Your job is to moderate posts. Please understand the context of the post. If 
        You will be given a post and you will need to determine if it is appropriate.
        You will need to return a list of categories that the post falls into.
        Your JOB IS NOT TO DETECT WHAT THIS POST IS ABOUT. Your JOB IS TO DETECT IF IT IS APPROPRIATE.
        Each category will have a name, a severity score, and a reason.
        The severity score will be a number between 0 and 100.
        The higher the severity score, the more severe the post is.
        The categories are:
        - Spam
        - Hate Speech
        - Sexual Content
        - Violence
        - Self-Harm
        - Bullying
        - Other
        The severity score will be a number between 0 and 100.
        The higher the severity score, the more severe the post is.
        The response should be in JSON format.
        The response should be in the following format:
        {
            "categories": [{name: "Spam", severity: 50, reason: "The post is a spam post."}, {name: "Hate Speech", severity: 50, reason: "The post is a hate speech post."}],
            "isAcceptable": false,
            "isAcceptableReason": "The post is not a spam post and not a hate speech post."
        }
    `,
  },
];

const moderateMessageContext: OpenAI.Chat.ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content: `
        Your job is to moderate messages. Please understand the context of the message. People can send messages that might look like hate speech, but they are not, etc. 
        Understanding the context of the message is key to moderating it. Messages like "I hate you" might be hate speech, but if it is in the context of a joke, it is not.
        Only the messages that are obviously falling into the categories below should be moderated.
        You will be given a message and you will need to determine if it is appropriate.
        You will need to return a list of categories that the message falls into.
        Each category will have a name, a severity score, and a reason.
        The severity score will be a number between 0 and 100.
        The higher the severity score, the more severe the message is.  
        The categories are:
        - Spam
        - Hate Speech
        - Sexual Content
        - Violence
        - Self-Harm
        - Bullying
        - Other
        The response should be in JSON format.
        The response should be in the following format:
        {
            "categories": [{name: "Spam", severity: 50, reason: "The message is a spam message."}, {name: "Hate Speech", severity: 50, reason: "The message is a hate speech message."}],
            "isAcceptable": false,
            "isAcceptableReason": "The message is not a spam message and not a hate speech message."
        }
    `,
  },
];

const DEFAULT_GPT_MODEL = 'gpt-4.1';

@Injectable()
export class OpenAiService implements AiModel {
  private readonly openai: OpenAI;
  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
      organization: this.configService.get('OPENAI_ORGANIZATION'),
    });
  }
  async moderateComment(
    comment: string,
    model?: string,
    prompt?: string,
  ): Promise<AIModelResponse> {
    const response = await this.openai.chat.completions.create({
      model: model || DEFAULT_GPT_MODEL,
      messages: [...moderateCommentContext, { role: 'user', content: comment }],
    });

    const content = String(response.choices[0].message.content);
    if (!content) throw new Error('No content in response');
    // TODO - Try catch JSON parse and return null if it fails for specific model
    try {
      return {
        ...(JSON.parse(content) as AIModelResponse),
        model: model || DEFAULT_GPT_MODEL,
      };
    } catch (error) {
      return {
        error: 'Error parsing response',
      };
    }
  }

  async moderateComments(comments: string[]) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        ...moderateCommentsContext,
        {
          role: 'user',
          content: comments.map((c) => `Comment: ${c}`).join('\n'),
        },
      ],
    });

    const content = String(response.choices[0].message.content);
    if (!content) throw new Error('No content in response');
    return JSON.parse(content) as { data: any };
  }
  async moderatePost(post: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [...moderatePostContext, { role: 'user', content: post }],
    });

    const content = String(response.choices[0].message.content);
    if (!content) throw new Error('No content in response');
    return JSON.parse(content) as { data: any };
  }
  async moderateMessage(message: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [...moderateMessageContext, { role: 'user', content: message }],
    });

    const content = String(response.choices[0].message.content);
    if (!content) throw new Error('No content in response');
    return JSON.parse(content) as { data: any };
  }

  async moderateImage(_image: string) {
    throw new Error('Not implemented');
  }
}
