// vero.mapper.ts
import { SocialInterface } from '../../../../../social/interfaces/social.interface';

export class VeroPayloadMapper {
  mapPayloadToSocial(payload: any): SocialInterface {
    const fullName =
      payload?.fullname ?? payload?.fullName ?? payload?.name ?? undefined;
    const [firstName, lastName] = fullName
      ? String(fullName).split(' ')
      : [];
    const id =
      payload?.veroUserId ??
      payload?.userId ??
      payload?.uid ??
      payload?.id ??
      payload?.email ??
      '';
    return {
      id: String(id),
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: payload?.email,
    };
  }
}
