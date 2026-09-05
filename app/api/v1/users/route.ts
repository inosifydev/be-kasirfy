import { NextRequest } from "next/server";
import { badRequest, created, internalServerError, ok } from "@/lib/http/response";
import { withAuth } from "@/lib/middleware/withAuth";
import { createUser, getUsers } from "@/services/user.service";

export const GET = withAuth(async () => {
  try {
    const data = await getUsers();
    return ok(data, "Users fetched successfully");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch users";

    return internalServerError(message, { source: "users.list" });
  }
}, { module: "user", action: "read" });

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const data = await createUser(body);

    return created(data, "User created successfully");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create user";

    if (message === "VALIDATION_ERROR") {
      return badRequest("Data user tidak valid");
    }

    return internalServerError(message, { source: "users.create" });
  }
}, { module: "user", action: "create" });

