import { NextFunction, Request, Response } from "express";

import * as authService from "../services/auth.service";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { OAuthProviderNotConfiguredError } from "../services/oauth.service";

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

    const auth = await authService.login(username, password);

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
    await authService.logout(req.user.id);

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

    const auth = await authService.loginWithGoogle(accessToken);

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

    const auth = await authService.loginWithApple(authorizationCode);

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

    const auth = await authService.completeOAuthRegistration({
      registrationToken,
      storeName,
    });

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

    const auth = await authService.switchStore(req.user.id, storeId);

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
