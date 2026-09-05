import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/lib/auth/jwt";
import { comparePassword, hashPassword } from "@/lib/auth/password";
import { userRepository } from "@/repositories/user.repository";

export async function login(identifier: string, password: string) {
  const normalizedIdentifier = identifier.trim();
  const user = await userRepository.findByUsernameOrEmail(normalizedIdentifier);

  if (!user || !user.password) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (user.is_active === false) {
    throw new Error("ACCOUNT_INACTIVE");
  }

  const isValidBcryptHash = typeof user.password === "string" && user.password.startsWith("$2");

  if (!isValidBcryptHash) {
    throw new Error("INVALID_CREDENTIALS");
  }

  try {
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error("INVALID_CREDENTIALS");
    }
  } catch {
    throw new Error("INVALID_CREDENTIALS");
  }

  const accessToken = signAccessToken({
    sub: user.id_user,
    email: user.email,
    username: user.username,
    name: user.nama_lengkap ?? user.username ?? user.email,
    roleId: user.id_role,
    type: "access",
  }, "15m");

  const refreshToken = signRefreshToken({
    sub: user.id_user,
    email: user.email,
    type: "refresh",
  }, "7d");

  return {
    user: {
      id: user.id_user,
      username: user.username,
      name: user.nama_lengkap ?? user.username ?? user.email,
      email: user.email,
      roleId: user.id_role,
    },
    accessToken,
    refreshToken,
  };
}

export async function register(input: Record<string, unknown>) {
  const username = String(input.username ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();
  const password = String(input.password ?? "");
  const namaLengkap = String(input.nama_lengkap ?? "").trim();
  const idRole = String(input.id_role ?? "").trim();

  if (!username || !password || !namaLengkap) {
    throw new Error("VALIDATION_ERROR");
  }

  if (idRole) {
    const role = await userRepository.findRoleById(idRole);
    if (!role) {
      throw new Error("ROLE_NOT_FOUND");
    }
  }

  const existingByUsername = await userRepository.findByUsername(username);
  if (existingByUsername) {
    throw new Error("USER_EXISTS");
  }

  if (email) {
    const existingByEmail = await userRepository.findByEmail(email);
    if (existingByEmail) {
      throw new Error("EMAIL_EXISTS");
    }
  }

  const hashedPassword = await hashPassword(password);

  const createdUser = await userRepository.create({
    username,
    password: hashedPassword,
    nama_lengkap: namaLengkap,
    email: email || null,
    no_hp: input.no_hp ?? null,
    id_role: idRole || null,
    is_active: input.is_active ?? true,
  });

  return {
    id: createdUser.id_user,
    username: createdUser.username,
    nama_lengkap: createdUser.nama_lengkap,
    email: createdUser.email,
    no_hp: createdUser.no_hp,
    id_role: createdUser.id_role,
    is_active: createdUser.is_active,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const payload = verifyRefreshToken<{ sub?: string; email?: string; type?: string }>(
    refreshToken
  );

  if (!payload || payload.type !== "refresh") {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const user = await userRepository.findById(String(payload.sub ?? ""));

  if (!user || user.is_active === false) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const accessToken = signAccessToken({
    sub: user.id_user,
    email: user.email,
    username: user.username,
    name: user.nama_lengkap ?? user.username ?? user.email,
    roleId: user.id_role,
    type: "access",
  }, "15m");

  return {
    accessToken,
  };
}

