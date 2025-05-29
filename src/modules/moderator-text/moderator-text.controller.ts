import { Body, Controller, Post } from '@nestjs/common';
import { ModeratorService } from './moderator-text.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ModeratorTextOptions } from './moderator-text.types';

// TODO - Finish up documentation for all endpoints
@ApiTags('Moderator')
@Controller('moderator')
export class ModeratorController {
  constructor(private readonly moderatorService: ModeratorService) {}

  @ApiOperation({ summary: 'Moderate a comment' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        comment: { type: 'string' },
      },
    },
  })

  // TODO - Finish up Schema for response
  @ApiResponse({
    status: 200,
    description: 'The comment has been moderated',
    schema: {
      type: 'object',
      properties: {
        comment: { type: 'string' },
      },
    },
  })
  @Post('comments/single')
  moderateComment(
    @Body()
    { comment, options }: { comment: string; options: ModeratorTextOptions },
  ) {
    console.log('Comment is ', comment);
    return this.moderatorService.moderateComment(comment, options);
  }

  @ApiOperation({ summary: 'Moderate a list of comments' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        comments: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'The comments have been moderated',
    schema: {
      type: 'object',
      properties: {
        comments: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  @Post('comments')
  moderateComments(@Body() { comments }: { comments: string[] }) {
    console.log('Comments are ', comments);
    return this.moderatorService.moderateComments(comments);
  }
  @Post('posts')
  moderatePost(@Body() { post }: { post: string }) {
    console.log('Post is ', post);
    return this.moderatorService.moderatePost(post);
  }

  @Post('messages')
  moderateMessage(@Body() { message }: { message: string }) {
    console.log('Message is ', message);
    return this.moderatorService.moderateMessage(message);
  }
}
