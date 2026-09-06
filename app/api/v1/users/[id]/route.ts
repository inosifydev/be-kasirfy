import { NextRequest } from "next/server";
import {
  badRequest,
  internalServerError,
  notFound,
  ok,
} from "@/lib/http/response";
import { withAuth } from "@/lib/middleware/withAuth";
import { deleteUser, getUserById, updateUser } from "@/services/user.service";

export const GET = withAuth(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    if (!id) {
      return badRequest("User id is required");
    }

    const data = await getUserById(id);
    return ok(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch user";

    if (message.toLowerCase().includes("not found")) {
      return notFound(message);
    }

    return internalServerError(message, { source: "users.getById" });
  }
}, { module: "user", action: "read" });

export const PUT = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    if (!id) {
      return badRequest("User id is required");
    }

    const body = await req.json();
    const data = await updateUser(id, body);

    return ok(data, "User updated successfully");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update user";

    if (message.toLowerCase().includes("not found")) {
      return notFound(message);
    }

    return internalServerError(message, { source: "users.update" });
  }
}, { module: "user", action: "update" });

export const DELETE = withAuth(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    if (!id) {
      return badRequest("User id is required");
    }

    const result = await deleteUser(id);
    return ok(result, "User deactivated");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete user";

    if (message.toLowerCase().includes("not found")) {
      return notFound(message);
    }

    return internalServerError(message, { source: "users.delete" });
  }
}, { module: "user", action: "delete" });

