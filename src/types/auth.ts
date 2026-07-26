import type { UserRole } from "./enums";

export type { UserRole } from "./enums";

export type AuthUser = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
};

export type AuthPayload = {
  token: string;
  user: AuthUser;
};

export type LoginPayload = {
  token: string;
  user: AuthUser;
};
