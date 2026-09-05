import { signToken } from "@/lib/auth/jwt";
import { comparePassword } from "@/lib/auth/password";
import { userRepository } from "@/repositories/user.repository";

export async function login(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await userRepository.findByEmail(normalizedEmail);

  if (!user || !user.password) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const accessToken = signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    accessToken,
  };
}

