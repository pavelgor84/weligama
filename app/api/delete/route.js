import { NextRequest, NextResponse } from "next/server";
import { unlink, stat } from "fs/promises"
import { join } from "path";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";


export async function POST(request) {
    const body = await request.json()
    const path = join(process.cwd(), '/', 'public', body.delete.src) // process.cwd() may be deleted

    stat(path, function (err, stats) {
        console.log("sdsds")
        console.log(stats);//here we got all information of file in stats variable

        if (err) {
            return console.error(err);
        }
    })
    stat(path)

    return NextResponse.json({ "success": true })
    //await initMongoose()
    //console.log("NextRequest")
    //console.log("Current working directory: ", process.cwd());


    //await writeFile(path, buffer)


    // try {
    //     const create_doc = await Restate.create(obj_props)
    //     console.log(create_doc)
    //     return NextResponse.json({ "success": true })
    // } catch (err) {
    //     return NextResponse.json({ "Error": err.message })
    // }


}