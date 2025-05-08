/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

// TODO - Reuse this message everywhere, especially the content that is used as context.
const moderateCommentContext: OpenAI.Chat.ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content: `
        Your job is to moderate comments. 
        You will be given a comment and you will need to determine if it is appropriate.
        You will need to return a list of categories that the comment falls into.
        Each category will have a name, a severity score, and a reason.
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
            "categories": [{name: "Spam", severity: 50, reason: "The comment is a spam comment."}, {name: "Hate Speech", severity: 50, reason: "The comment is a hate speech comment."}],
            "overallSeverity": 50,
            "isAcceptable": false,
            "isAcceptableReason": "The comment is not a spam comment and not a hate speech comment."
        }
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
            "overallSeverity": 50,
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
            "overallSeverity": 50,
            "isAcceptable": false,
            "isAcceptableReason": "The message is not a spam message and not a hate speech message."
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
      messages: [...moderateCommentContext, { role: 'user', content: comment }],
    });

    console.log('Response from ai');
    console.dir(response, { depth: null });
    const content = String(response.choices[0].message.content);
    if (!content) throw new Error('No content in response');
    return JSON.parse(content) as { data: any };
  }
  async moderatePost(post: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [...moderatePostContext, { role: 'user', content: post }],
    });

    console.log('Response from ai');
    console.dir(response, { depth: null });
    const content = String(response.choices[0].message.content);
    if (!content) throw new Error('No content in response');
    return JSON.parse(content) as { data: any };
  }
  async moderateMessage(message: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [...moderateMessageContext, { role: 'user', content: message }],
    });

    console.log('Response from ai');
    console.dir(response, { depth: null });
    const content = String(response.choices[0].message.content);
    if (!content) throw new Error('No content in response');
    return JSON.parse(content) as { data: any };
  }

  async moderateImage(_image: string) {
    throw new Error('Not implemented');
  }
}
