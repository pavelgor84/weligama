import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises"
import { join } from "path";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";


export async function POST(request) {
    const body = await request.json()

    console.log(body)
    return NextResponse.json({ "success": true })
    //await initMongoose()
    //console.log("NextRequest")
    //console.log("Current working directory: ", process.cwd());

    //const path = join(process.cwd(), '/', 'public', '/', 'images', '/', 'south', body.name) // process.cwd() may be deleted
    //await writeFile(path, buffer)


    // try {
    //     const create_doc = await Restate.create(obj_props)
    //     console.log(create_doc)
    //     return NextResponse.json({ "success": true })
    // } catch (err) {
    //     return NextResponse.json({ "Error": err.message })
    // }


}