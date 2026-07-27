import jwt from "jsonwebtoken";
import { appConfig } from "../config/app.config";

export type GoogleTokenPayload = {
  sub: string;
  email: string;
  name: string;
  picture: string;
};

export type AppleTokenPayload = {
  sub: string;
  email: string;
};

export class OAuthTokenInvalidError extends Error {
  constructor() {
    super("Token OAuth tidak valid.");
  }
}

export class OAuthProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`${provider} belum dikonfigurasi.`);
  }
}

export const verifyGoogleToken = async (
  accessToken: string
): Promise<GoogleTokenPayload> => {
  try {
    const tokenInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`
    );

    if (!tokenInfoResponse.ok) {
      throw new OAuthTokenInvalidError();
    }

    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      throw new OAuthTokenInvalidError();
    }

    const userInfo = await userInfoResponse.json() as {
      sub: string;
      email: string;
      name: string;
      picture: string;
    };

    if (!userInfo.sub || !userInfo.email) {
      throw new OAuthTokenInvalidError();
    }

    return {
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name ?? userInfo.email,
      picture: userInfo.picture ?? "",
    };
  } catch (error) {
    throw new OAuthTokenInvalidError();
  }
};

export const verifyAppleToken = async (
  authorizationCode: string
): Promise<AppleTokenPayload> => {
  if (
    !appConfig.appleClientId ||
    !appConfig.appleTeamId ||
    !appConfig.appleKeyId ||
    !appConfig.applePrivateKey
  ) {
    throw new OAuthProviderNotConfiguredError("Apple");
  }

  try {
    const clientSecret = jwt.sign(
      {},
      appConfig.applePrivateKey,
      {
        algorithm: "ES256",
        issuer: appConfig.appleTeamId,
        audience: "https://appleid.apple.com",
        subject: appConfig.appleClientId,
        keyid: appConfig.appleKeyId,
        expiresIn: "5m",
      }
    );

    const params = new URLSearchParams({
      client_id: appConfig.appleClientId,
      client_secret: clientSecret,
      code: authorizationCode,
      grant_type: "authorization_code",
    });

    const response = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new OAuthTokenInvalidError();
    }

    const data = await response.json() as {
      id_token: string;
      access_token: string;
    };

    const decoded = jwt.decode(data.id_token) as jwt.JwtPayload | null;

    if (!decoded || !decoded.sub) {
      throw new OAuthTokenInvalidError();
    }

    return {
      sub: decoded.sub,
      email: (decoded.email as string) ?? "",
    };
  } catch (error) {
    if (
      error instanceof OAuthProviderNotConfiguredError ||
      error instanceof OAuthTokenInvalidError
    ) {
      throw error;
    }

    throw new OAuthTokenInvalidError();
  }
};
