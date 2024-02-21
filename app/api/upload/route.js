import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises"
import { join } from "path";
// import { initMongoose } from "@/db/mongoose";
// import Restate from "@/models/Restate";


export async function POST(request) {
    // await initMongoose()
    console.log("NextRequest")
    console.log("Current working directory: ",
        process.cwd());

    const data = await request.formData()
    const props = data.get('prop')          //GET PROPS
    if (!props) {
        return NextResponse.json({ "success": false })
    }
    console.log(JSON.parse(props))

    console.log("Current working directory: ", process.cwd());

    const formDataEntryValues = Array.from(data.values()); // GET FILES
    for (const formDataEntryValue of formDataEntryValues) {
        if (typeof formDataEntryValue === "object" && "arrayBuffer" in formDataEntryValue) {
            /// MAKE SANITY!!!!!
            const file = formDataEntryValue;
            const buffer = Buffer.from(await file.arrayBuffer());
            const path = join(process.cwd(), '/', 'public', '/', 'images', '/', 'south', file.name) // process.cwd() may be deleted
            await writeFile(path, buffer)
        }
    }

    return NextResponse.json({ "success": true })

}