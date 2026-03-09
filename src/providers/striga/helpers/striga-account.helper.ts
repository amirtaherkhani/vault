import { Account } from '../../../accounts/domain/account';
import { StrigaUser } from '../striga-users/domain/striga-user';

/**
 * Returns true when the local account belongs to the same app user (email match).
 */
export function isAccountOwnedByAppUser(
  account: Account,
  strigaUser: Pick<StrigaUser, 'email'>,
): boolean {
  const accountEmail = String(account.user?.email ?? '')
    .trim()
    .toLowerCase();
  const strigaEmail = String(strigaUser.email ?? '')
    .trim()
    .toLowerCase();
  if (!accountEmail || !strigaEmail) return false;
  return accountEmail === strigaEmail;
}

/**
 * Returns true when the local account row maps to the given Striga external user id.
 */
export function isAccountOwnedByStrigaUser(
  account: Account,
  strigaUser: Pick<StrigaUser, 'externalId'>,
): boolean {
  const customerRefId = String(account.customerRefId ?? '').trim();
  const externalId = String(strigaUser.externalId ?? '').trim();
  if (!customerRefId || !externalId) return false;
  return customerRefId === externalId;
}
