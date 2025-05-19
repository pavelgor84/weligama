import { NextResponse } from "next/server";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";

// export async function handle(req, res) {
//     await initMongoose()
//     res.json(await Restate.find().exec())
// }

export async function GET() {
    await initMongoose()
    // return NextResponse.json(await Restate.find({ "available": "Yes" }).exec())
    return NextResponse.json(await Restate.find({ available: true }, { coordinates: 1, _id: 1, price: 1 }).exec())

}