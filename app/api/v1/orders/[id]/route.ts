import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  noContent,
  notFound,
  ok,
} from "@/lib/http/response";
import { deleteOrder, getOrderById, updateOrder } from "@/services/order.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return badRequest("Order id is required");
    }

    const data = await getOrderById(id);
    return ok(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch order";

    if (message.toLowerCase().includes("not found")) {
      return notFound(message);
    }

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return badRequest("Order id is required");
    }

    const body = await req.json();
    const data = await updateOrder(id, body);

    return ok(data, "Order updated");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update order";

    if (message.toLowerCase().includes("not found")) {
      return notFound(message);
    }

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return badRequest("Order id is required");
    }

    await deleteOrder(id);
    return noContent();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete order";

    if (message.toLowerCase().includes("not found")) {
      return notFound(message);
    }

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

