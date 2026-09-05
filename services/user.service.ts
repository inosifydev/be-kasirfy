import { userRepository } from "@/repositories/user.repository";

export async function getUsers() {
  const users = await userRepository.findMany();

  return users.map((user: any) => ({
    id_user: user.id_user,
    username: user.username,
    nama_lengkap: user.nama_lengkap,
    email: user.email,
    no_hp: user.no_hp,
    is_active: user.is_active,
    created_at: user.created_at,
    role: user.tb_role
      ? {
          id_role: user.tb_role.id_role,
          nama_role: user.tb_role.nama_role,
        }
      : null,
  }));
}

export async function getUserById(id: string) {
  const user = await userRepository.findById(id);

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id_user: user.id_user,
    username: user.username,
    nama_lengkap: user.nama_lengkap,
    email: user.email,
    no_hp: user.no_hp,
    is_active: user.is_active,
    created_at: user.created_at,
    role: user.tb_role
      ? {
          id_role: user.tb_role.id_role,
          nama_role: user.tb_role.nama_role,
        }
      : null,
  };
}

export async function createUser(input: Record<string, unknown>) {
  const user = await userRepository.create(input);

  return {
    id_user: user.id_user,
    username: user.username,
    nama_lengkap: user.nama_lengkap,
    email: user.email,
    no_hp: user.no_hp,
    is_active: user.is_active,
    created_at: user.created_at,
    role: user.tb_role
      ? {
          id_role: user.tb_role.id_role,
          nama_role: user.tb_role.nama_role,
        }
      : null,
  };
}

export async function updateUser(id: string, input: Record<string, unknown>) {
  const existingUser = await userRepository.findById(id);

  if (!existingUser) {
    throw new Error("User not found");
  }

  const user = await userRepository.updateById(id, input);

  return {
    id_user: user.id_user,
    username: user.username,
    nama_lengkap: user.nama_lengkap,
    email: user.email,
    no_hp: user.no_hp,
    is_active: user.is_active,
    created_at: user.created_at,
    role: user.tb_role
      ? {
          id_role: user.tb_role.id_role,
          nama_role: user.tb_role.nama_role,
        }
      : null,
  };
}

export async function deleteUser(id: string) {
  const existingUser = await userRepository.findById(id);

  if (!existingUser) {
    throw new Error("User not found");
  }

  await userRepository.deleteById(id);
  return true;
}

