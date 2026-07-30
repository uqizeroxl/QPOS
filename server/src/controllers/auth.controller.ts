import { NextFunction, Request, Response } from "express";

import * as authService from "../services/auth.service";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { OAuthProviderNotConfiguredError, OAuthTokenInvalidError } from "../services/oauth.service";

type AcceptOwnershipBody = {
  token?: string;
};

type LoginRequestBody = {
  username?: string;
  password?: string;
};

type OAuthRequestBody = {
  accessToken?: string;
  authorizationCode?: string;
};

type CompleteRegistrationBody = {
  registrationToken?: string;
  storeName?: string;
};

type RefreshRequestBody = {
  refreshToken?: string;
};

export const login = async (
  req: Request<unknown, unknown, LoginRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const username = req.body.username?.trim() ?? "";
    const password = req.body.password ?? "";

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: "Username dan password wajib diisi."
      });
      return;
    }

    const deviceInfo = {
      userAgent: req.headers["user-agent"] ?? "",
      ipAddress: req.ip ?? req.socket.remoteAddress ?? "",
    };

    const auth = await authService.login(username, password, deviceInfo);

    res.status(200).json({
      success: true,
      message: "Login berhasil.",
      data: auth
    });
  } catch (error) {
    if (
      error instanceof authService.InvalidCredentialsError ||
      error instanceof authService.UserInactiveError ||
      error instanceof authService.StoreMembershipRequiredError ||
      error instanceof authService.StoreInactiveError
    ) {
      res.status(401).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Unexpected error while logging in:", error);
    next(error);
  }
};

export const profile = (
  req: AuthenticatedRequest,
  res: Response
) => {
  res.status(200).json({
    success: true,
    message: "Profile retrieved successfully",
    data: req.user
  });
};

export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const deviceId = req.body.deviceId?.trim() || undefined;
    await authService.logout(req.user.id, deviceId);

    res.status(200).json({
      success: true,
      message: "Logout berhasil."
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request<unknown, unknown, RefreshRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshTokenValue = req.body.refreshToken?.trim() ?? "";

    if (!refreshTokenValue) {
      res.status(400).json({
        success: false,
        message: "Refresh token wajib dikirim."
      });
      return;
    }

    const auth = await authService.refreshToken(refreshTokenValue);

    res.status(200).json({
      success: true,
      message: "Token berhasil diperbarui.",
      data: auth
    });
  } catch (error) {
    if (error instanceof authService.AuthTokenInvalidError) {
      res.status(401).json({
        success: false,
        message: error.message
      });
      return;
    }

    next(error);
  }
};

export const googleLogin = async (
  req: Request<unknown, unknown, OAuthRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = req.body.accessToken?.trim() ?? "";

    if (!accessToken) {
      res.status(400).json({
        success: false,
        message: "Google Access Token wajib dikirim."
      });
      return;
    }

    const deviceInfo = {
      userAgent: req.headers["user-agent"] ?? "",
      ipAddress: req.ip ?? req.socket.remoteAddress ?? "",
    };

    const auth = await authService.loginWithGoogle(accessToken, deviceInfo);

    if (auth && "needsRegistration" in auth && auth.needsRegistration) {
      res.status(200).json({
        success: true,
        message: "Lanjutkan pendaftaran toko.",
        data: auth
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Login dengan Google berhasil.",
      data: auth
    });
  } catch (error) {
    if (
      error instanceof OAuthProviderNotConfiguredError
    ) {
      res.status(501).json({
        success: false,
        message: error.message
      });
      return;
    }

    if (
      error instanceof authService.UserInactiveError ||
      error instanceof authService.StoreInactiveError
    ) {
      res.status(401).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Unexpected error while logging in with Google:", error);
    next(error);
  }
};

export const tiktokLogin = async (
  req: Request<unknown, unknown, OAuthRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authorizationCode = req.body.authorizationCode?.trim() ?? "";

    if (!authorizationCode) {
      res.status(400).json({
        success: false,
        message: "TikTok Authorization Code wajib dikirim."
      });
      return;
    }

    const deviceInfo = {
      userAgent: req.headers["user-agent"] ?? "",
      ipAddress: req.ip ?? req.socket.remoteAddress ?? "",
    };

    const auth = await authService.loginWithTikTok(authorizationCode, deviceInfo);

    if (auth && "needsRegistration" in auth && auth.needsRegistration) {
      res.status(200).json({
        success: true,
        message: "Lanjutkan pendaftaran toko.",
        data: auth
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Login dengan TikTok berhasil.",
      data: auth
    });
  } catch (error) {
    if (
      error instanceof OAuthProviderNotConfiguredError
    ) {
      res.status(501).json({
        success: false,
        message: error.message
      });
      return;
    }

    if (
      error instanceof authService.UserInactiveError ||
      error instanceof authService.StoreInactiveError
    ) {
      res.status(401).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Unexpected error while logging in with TikTok:", error);
    next(error);
  }
};

export const appleLogin = async (
  req: Request<unknown, unknown, OAuthRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authorizationCode = req.body.authorizationCode?.trim() ?? "";

    if (!authorizationCode) {
      res.status(400).json({
        success: false,
        message: "Apple Authorization Code wajib dikirim."
      });
      return;
    }

    const deviceInfo = {
      userAgent: req.headers["user-agent"] ?? "",
      ipAddress: req.ip ?? req.socket.remoteAddress ?? "",
    };

    const auth = await authService.loginWithApple(authorizationCode, deviceInfo);

    if (auth && "needsRegistration" in auth && auth.needsRegistration) {
      res.status(200).json({
        success: true,
        message: "Lanjutkan pendaftaran toko.",
        data: auth
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Login dengan Apple berhasil.",
      data: auth
    });
  } catch (error) {
    if (
      error instanceof OAuthProviderNotConfiguredError
    ) {
      res.status(501).json({
        success: false,
        message: error.message
      });
      return;
    }

    if (
      error instanceof authService.UserInactiveError ||
      error instanceof authService.StoreInactiveError
    ) {
      res.status(401).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Unexpected error while logging in with Apple:", error);
    next(error);
  }
};

export const completeRegistration = async (
  req: Request<unknown, unknown, CompleteRegistrationBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const registrationToken = req.body.registrationToken?.trim() ?? "";
    const storeName = req.body.storeName?.trim() ?? "";

    if (!registrationToken || !storeName) {
      res.status(400).json({
        success: false,
        message: "Token registrasi dan nama toko wajib diisi."
      });
      return;
    }

    const deviceInfo = {
      userAgent: req.headers["user-agent"] ?? "",
      ipAddress: req.ip ?? req.socket.remoteAddress ?? "",
    };

    const auth = await authService.completeOAuthRegistration({
      registrationToken,
      storeName,
    }, deviceInfo);

    res.status(200).json({
      success: true,
      message: "Pendaftaran toko berhasil.",
      data: auth
    });
  } catch (error) {
    if (error instanceof authService.AuthTokenInvalidError) {
      res.status(401).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Unexpected error while completing registration:", error);
    next(error);
  }
};

export const listStores = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const stores = await authService.listStores(req.user.id);

    res.status(200).json({
      success: true,
      message: "Daftar toko berhasil diambil.",
      data: stores
    });
  } catch (error) {
    next(error);
  }
};

export const switchStore = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const storeId = req.body.storeId?.trim() ?? "";

    if (!storeId) {
      res.status(400).json({
        success: false,
        message: "Store ID wajib diisi."
      });
      return;
    }

    const auth = await authService.switchStore(req.user.id, storeId, req.user.deviceId);

    res.status(200).json({
      success: true,
      message: "Berhasil beralih toko.",
      data: auth
    });
  } catch (error) {
    if (
      error instanceof authService.StoreMembershipRequiredError ||
      error instanceof authService.StoreInactiveError
    ) {
      res.status(401).json({
        success: false,
        message: error.message
      });
      return;
    }

    next(error);
  }
};

export const acceptOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = req.body as AcceptOwnershipBody;
    const token = body.token?.trim() ?? "";

    if (!token) {
      res.status(400).json({
        success: false,
        message: "Token undangan wajib dikirim."
      });
      return;
    }

    await authService.acceptOwnerInvitation(token, req.user.id);

    res.status(200).json({
      success: true,
      message: "Kepemilikan toko berhasil diterima. Silakan login ulang."
    });
  } catch (error) {
    if (
      error instanceof authService.InvitationNotFoundError ||
      error instanceof authService.InvitationEmailMismatchError
    ) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

export const accountInfo = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const info = await authService.getAccountInfo(req.user.id);
    res.status(200).json({
      success: true,
      data: info
    });
  } catch (error) {
    next(error);
  }
};

type BindGoogleBody = {
  accessToken?: string;
};

type BindTikTokBody = {
  authorizationCode?: string;
};

export const bindTikTok = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = req.body as BindTikTokBody;
    const authorizationCode = body.authorizationCode?.trim() ?? "";

    if (!authorizationCode) {
      res.status(400).json({
        success: false,
        message: "TikTok Authorization Code wajib dikirim."
      });
      return;
    }

    const result = await authService.bindTikTokAccount(req.user.id, authorizationCode);

    res.status(200).json({
      success: true,
      message: `Akun TikTok (@${result.name}) berhasil terhubung.`,
      data: result
    });
  } catch (error) {
    if (
      error instanceof OAuthProviderNotConfiguredError ||
      error instanceof OAuthTokenInvalidError ||
      error instanceof authService.TikTokAlreadyBoundError
    ) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

export const bindGoogle = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = req.body as BindGoogleBody;
    const accessToken = body.accessToken?.trim() ?? "";

    if (!accessToken) {
      res.status(400).json({
        success: false,
        message: "Google Access Token wajib dikirim."
      });
      return;
    }

    const result = await authService.bindGoogleAccount(req.user.id, accessToken);

    res.status(200).json({
      success: true,
      message: `Akun Google (${result.email}) berhasil terhubung.`,
      data: result
    });
  } catch (error) {
    if (
      error instanceof OAuthProviderNotConfiguredError ||
      error instanceof OAuthTokenInvalidError ||
      error instanceof authService.GoogleAlreadyBoundError
    ) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};
