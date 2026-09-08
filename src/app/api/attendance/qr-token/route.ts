import { NextRequest, NextResponse } from "next/server";
import { getQRTokenAction } from "@/app/actions/attendance";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Missing session_id parameter." },
        { status: 400 }
      );
    }

    const result = await getQRTokenAction(sessionId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, token: result.token });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
