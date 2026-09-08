import { NextRequest, NextResponse } from "next/server";
import { checkInAction } from "@/app/actions/attendance";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, token, latitude, longitude, deviceFingerprint } = body;

    if (!sessionId || !token || latitude === undefined || longitude === undefined || !deviceFingerprint) {
      return NextResponse.json(
        { success: false, error: "Missing required fields in request body." },
        { status: 400 }
      );
    }

    const result = await checkInAction(
      sessionId,
      token,
      Number(latitude),
      Number(longitude),
      deviceFingerprint
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      message: result.message,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
