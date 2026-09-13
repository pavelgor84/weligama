import { NextResponse } from "next/server";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";
import { requireAdminEmail } from "@/auth";


export async function POST(req) {

    // Only the authenticated user may read their own properties (no IDOR)
    const sessionEmail = await requireAdminEmail();
    if (typeof sessionEmail !== "string") return sessionEmail; // 401 response

    await initMongoose()

    const body = await req.json()

    console.log("body " + JSON.stringify(body))

    // Query anchored to the session email, not client-supplied
    return NextResponse.json(await Restate.find({ mail: sessionEmail }).exec())
}
