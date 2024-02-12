import { NextResponse } from "next/server";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";

// export async function handle(req, res) {
//     await initMongoose()
//     res.json(await Restate.find().exec())
// }

export async function POST(req, res) {
    console.log(req.body)
    return NextResponse.json({ status: "COOL" })

    //await initMongoose()
    //return NextResponse.json(await Restate.find().exec())

}