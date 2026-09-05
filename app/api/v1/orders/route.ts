import { NextResponse } from "next/server";
import { getOrders } from "@/services/order.service";

//get data order
export async function GET() {
  try {
    const data = await getOrders();

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
