import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { booleanValidator } from '../../utils/helpers/env.helper';

@Injectable()
export class DynamicAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    if (this.useExternalToken()) {
      const guard = new (AuthGuard(['jwt', 'vero-bearer']))();
      return guard.canActivate(context);
    }
    return super.canActivate(context);
  }

  private useExternalToken(): boolean {
    return booleanValidator(process.env.AUTH_VERO_USE_EXTERNAL_TOKEN, false);
  }
}
