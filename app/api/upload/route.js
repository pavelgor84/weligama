import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises"
import { join } from "path";
// import { initMongoose } from "@/db/mongoose";
// import Restate from "@/models/Restate";


// export async function POST(request) {
//     // await initMongoose()
//     console.log("NextRequest")
//     console.log("Current working directory: ",
//         process.cwd());

//     const data = await request.formData()
//     const file = data.get('file')
//     if (!file) {
//         return NextResponse.json({ "success": false })
//     }
//     const bytes = await file.arrayBuffer()
//     const buffer = Buffer.from(bytes)
//     const path = join(process.cwd(), '/', 'public', '/', 'images', '/', 'south', file.name) // process.cwd() may be deleted
//     await writeFile(path, buffer)
//     console.log(`open file path ${path} to see the file`)
//     return NextResponse.json({ "success": true })

// }

export async function POST(request) {
    // await initMongoose()
    console.log("NextRequest")
    console.log("Current working directory: ",
        process.cwd());

    const data = await request.formData()
    const file = data.get('prop')
    if (!file) {
        return NextResponse.json({ "success": false })
    }
    console.log(JSON.parse(file))

    return NextResponse.json({ "success": true })

}