import { User } from '../../../users/domain/user';
import { RequestWithUser } from '../../../utils/types/object.type';
import { StrigaUser } from '../striga-users/domain/striga-user';

export type StrigaRequestContext = {
  appUser: User;
  strigaUser: StrigaUser;
};

export interface StrigaRequestWithContext extends RequestWithUser {
  striga?: StrigaRequestContext;
}
