import type { UserFromJwt } from '../modules/auth/types/user-from-jwt';

declare global {
  namespace Express {
    interface User extends UserFromJwt {}
  }
}
