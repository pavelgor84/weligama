import { NextResponse, NextRequest } from "next/server";
//import {NextApiRequest,NextApiResponse} from "next"
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";

// export async function handle(req, res) {

//     console.log(JSON.stringify(req.body))
//     // await initMongoose()
//     // res.json(await Restate.find().exec())
// }

export async function POST(req, res) {

    await initMongoose()

    const body = await req.json()

    console.log("body " + JSON.stringify(body))
    //SANITY!!!

    return NextResponse.json(await Restate.find({ mail: body }).exec())
    //return NextResponse.json({ "yes": 1 })

}