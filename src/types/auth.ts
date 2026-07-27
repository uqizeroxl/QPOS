import type { UserRole } from "./enums";

export type { UserRole } from "./enums";

export type AuthUser = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  storeId: string;
};

export type StoreInfo = {
  id: string;
  name: string;
  role: string;
};

export type AuthPayload = {
  token: string;
  user: AuthUser;
  stores?: StoreInfo[];
};

export type LoginPayload = {
  token: string;
  user: AuthUser;
};

export type OAuthRegistrationPayload = {
  needsRegistration: true;
  registrationToken: string;
  user: {
    id: string;
    username: string;
    name: string;
  };
};

export type OAuthLoginResponse = AuthPayload | OAuthRegistrationPayload;
