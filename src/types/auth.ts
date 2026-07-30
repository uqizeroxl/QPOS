import type { UserRole } from "./enums";

export type { UserRole } from "./enums";

export type AuthUser = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  storeId: string;
  deviceId?: string;
};

export type StoreInfo = {
  id: string;
  name: string;
  role: string;
  registeredAt?: string;
};

export type AuthPayload = {
  token: string;
  refreshToken: string;
  user: AuthUser;
  stores?: StoreInfo[];
};

export type LoginPayload = {
  token: string;
  refreshToken: string;
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
