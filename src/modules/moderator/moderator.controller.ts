import { Body, Controller, Post } from '@nestjs/common';
import { ModeratorService } from './moderator.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

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
  @Post('comments')
  moderateComment(@Body() { comment }: { comment: string }) {
    console.log('Comment is ', comment);
    return this.moderatorService.moderateComment(comment);
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

  @Post('images')
  moderateImage(@Body() { image }: { image: string }) {
    console.log('Image is ', image);
    return this.moderatorService.moderateComment(image);
  }
}
