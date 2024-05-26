import { NextResponse, NextRequest } from "next/server";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";



export async function POST(req, res) {

    await initMongoose()

    const body = await req.json()

    console.log("body " + JSON.stringify(body))

    return NextResponse.json(await Restate.findById(body).exec())

}