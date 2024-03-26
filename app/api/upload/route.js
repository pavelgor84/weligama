import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises"
import { join } from "path";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";
import { UploadImage } from "@/app/lib/upload";


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


    let obj_props = JSON.parse(props)

    //console.log("Current working directory: ", process.cwd());

    const formDataEntryValues = Array.from(data.values()); // GET FILES
    let arr = []
    for (const formDataEntryValue of formDataEntryValues) {
        if (typeof formDataEntryValue === "object" && "arrayBuffer" in formDataEntryValue) {
            /// MAKE SANITY!!!!!

            const data = await UploadImage(formDataEntryValue, "sri-lanka")

            // const file = formDataEntryValue;
            // const buffer = Buffer.from(await file.arrayBuffer());
            // const path = join(process.cwd(), '/', 'public', '/', 'images', '/', 'south', file.name) // process.cwd() may be deleted
            // await writeFile(path, buffer)

            // let image_object = { src: join('/', 'images', '/', 'south', file.name), alt: file.name }
            // arr.push(image_object)
            return NextResponse.json({ "msg": data }, { status: 200 })

        }
    }
    obj_props.images = arr
    console.log(`props: ${JSON.stringify(obj_props)}`)

    // try {
    //     const create_doc = await Restate.create(obj_props)
    //     console.log(create_doc)
    //     return NextResponse.json({ "success": true })
    // } catch (err) {
    //     return NextResponse.json({ "Error": err.message })
    // }


}