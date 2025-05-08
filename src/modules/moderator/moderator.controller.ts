import { Body, Controller, Post } from '@nestjs/common';
import { ModeratorService } from './moderator.service';

@Controller('moderator')
export class ModeratorController {
  constructor(private readonly moderatorService: ModeratorService) {}
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
}
