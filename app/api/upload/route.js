import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises"
import { join, resolve } from "path";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";
import { UploadImage } from "@/app/lib/upload";
import { rejects } from "assert";


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
    let imagesArray = []
    for (const formDataEntryValue of formDataEntryValues) {
        if (typeof formDataEntryValue === "object" && "arrayBuffer" in formDataEntryValue) {
            /// MAKE SANITY!!!!!

            //const data = await UploadImage(formDataEntryValue, "sri-lanka")

            // const file = formDataEntryValue;
            // const buffer = Buffer.from(await file.arrayBuffer());
            // const path = join(process.cwd(), '/', 'public', '/', 'images', '/', 'south', file.name) // process.cwd() may be deleted
            // await writeFile(path, buffer)

            // let image_object = { src: join('/', 'images', '/', 'south', file.name), alt: file.name }
            // arr.push(image_object)
            //return NextResponse.json({ "msg": data }, { status: 200 })
            imagesArray.push(formDataEntryValue)

        }
    }

    return new Promise((resolve, reject) => {
        const uploads = imagesArray.map((im) => UploadImage(im, "sri-lanka"))
        Promise.all(uploads).then((values) => resolve(NextResponse.json({ "msg": values }, { status: 200 }))).catch((err) => reject(err))
    })

    //obj_props.images = arr
    //console.log(`props: ${JSON.stringify(obj_props)}`)




}