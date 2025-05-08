import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class AppController {
  @ApiOperation({ summary: 'Get the health status of the API' })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ok',
        },
        timestamp: {
          type: 'string',
          example: '2024-03-21T12:00:00.000Z',
        },
      },
    },
  })
  @Get()
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
