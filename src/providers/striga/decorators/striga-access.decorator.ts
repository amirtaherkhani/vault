import { applyDecorators, SetMetadata } from '@nestjs/common';

export const STRIGA_REQUIRE_USER_KEY = 'striga:require-user';
export const STRIGA_REQUIRE_KYC_APPROVED_KEY = 'striga:require-kyc-approved';

export function RequireStrigaUser(): ClassDecorator & MethodDecorator {
  return SetMetadata(STRIGA_REQUIRE_USER_KEY, true);
}

export function RequireStrigaKycApproved(): ClassDecorator & MethodDecorator {
  return applyDecorators(
    SetMetadata(STRIGA_REQUIRE_USER_KEY, true),
    SetMetadata(STRIGA_REQUIRE_KYC_APPROVED_KEY, true),
  );
}
