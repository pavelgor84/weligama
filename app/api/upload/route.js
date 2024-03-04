import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises"
import { join } from "path";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";


export async function POST(request) {
    await initMongoose()
    //console.log("NextRequest")
    //console.log("Current working directory: ", process.cwd());

    const data = await request.formData()
    const props = data.get('prop')          //GET PROPS
    if (!props) {
        return NextResponse.json({ "success": false })
    }
    //CHECK FOR DUPLICATES HERE!!!

    //console.log(JSON.parse(props))
    let obj_props = JSON.parse(props)

    //console.log("Current working directory: ", process.cwd());

    const formDataEntryValues = Array.from(data.values()); // GET FILES
    let arr = []
    for (const formDataEntryValue of formDataEntryValues) {
        if (typeof formDataEntryValue === "object" && "arrayBuffer" in formDataEntryValue) {
            /// MAKE SANITY!!!!!

            const file = formDataEntryValue;
            const buffer = Buffer.from(await file.arrayBuffer());
            const path = join(process.cwd(), '/', 'public', '/', 'images', '/', 'south', file.name) // process.cwd() may be deleted
            await writeFile(path, buffer)

            let image_object = { src: join('/', 'public', '/', 'images', '/', 'south', file.name), alt: file.name }
            arr.push(image_object)
            //console.log(`Arr: ${JSON.stringify(arr)}`)
        }
    }
    obj_props.images = arr
    console.log(`props: ${JSON.stringify(obj_props)}`)

    try {
        const create_doc = await Restate.create(obj_props)
        console.log(create_doc)
        return NextResponse.json({ "success": true })
    } catch (err) {
        return NextResponse.json({ "Error": err.message })
    }


}