import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { log } from 'console';

export const AuthUser = createParamDecorator((data, req: ExecutionContext) => {
  let request = req.switchToHttp().getRequest().headers["user"];
  return request;
});