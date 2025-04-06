import { NextRequest, NextResponse } from "next/server";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";


export async function POST(request) {
    await initMongoose()

    const housesIds = await request.json()
    console.log(housesIds)


    // Restate.find({
    //     _id: { $in: housesIds },
    //     available: "Yes"
    // })
    //     .then(docs => {
    //         console.log(docs);
    //         return NextResponse.json(docs)
    //     })
    //     .catch(err => {
    //         console.error(err);
    //     });
    return NextResponse.json(await Restate.find({ _id: { $in: housesIds }, "available": "Yes" }).exec())

}
