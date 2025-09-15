export interface UserFromJwt {
  userId: string;
  username: string;
  email?: string;
  roles: string[];
}
