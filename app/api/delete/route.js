import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";
import { DeleteImage } from "@/app/lib/delete";


export async function POST(request) {
    await initMongoose()

    const body = await request.json()
    //const path = join(process.cwd(), '/', 'public', body.delete.src) // process.cwd() may be deleted
    //console.log(body)

    const result_delete = await DeleteImage(body.delete.public_id)
    console.log(result_delete)
    delete body.delete


    const update_db = await Restate.updateOne({ _id: body._id }, { $set: body })
    console.log(update_db)

    return NextResponse.json({ "success": true })


}