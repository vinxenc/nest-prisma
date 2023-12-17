import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/features/arguments-host.interface';
import { FastifyReply } from 'fastify';
import { ObserveLogger } from '../../plugins/logger';

type Exception = HttpException | Error;
// | QueryFailedError import { QueryFailedError } from 'typeorm'

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(private logger: ObserveLogger) {}

  private static response(response: FastifyReply, exception: Exception): void {
    let responseBody: object | string = { message: 'Internal server error' };
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      responseBody = exception.getResponse();
      statusCode = exception.getStatus();
    }
    // else if (exception instanceof QueryFailedError) {
    //   statusCode = HttpStatus.BAD_REQUEST
    //   responseBody = {
    //     statusCode: statusCode,
    //     message: exception.message,
    //   }
    // }
    else if (exception instanceof Error) {
      responseBody = {
        statusCode,
        message: exception.message,
      };
    }

    response.status(statusCode).send(responseBody);
  }

  catch(exception: HttpException | Error, host: ArgumentsHost): void {
    const ctx: HttpArgumentsHost = host.switchToHttp();
    const response: FastifyReply = ctx.getResponse();

    // Handling error message and logging
    this.handleException(exception);

    // Response to client
    AllExceptionFilter.response(response, exception);
  }

  private handleException(exception: Exception): void {
    let message = 'Internal Server Error';
    let stack;

    if (exception instanceof HttpException) {
      message = JSON.stringify(exception.getResponse());
      stack = exception.stack.toString();
    }
    // else if (exception instanceof QueryFailedError) {
    //   message = exception.stack.toString()
    // }
    else if (exception instanceof Error) {
      message = exception.message;
      stack = exception.stack.toString();
    }

    this.logger.error(message, stack, exception.name);
  }
}
