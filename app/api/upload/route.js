import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises"
import { join, resolve } from "path";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";
import { UploadImage } from "@/app/lib/upload";
import { rejects } from "assert";


export async function POST(request) {
    await initMongoose()

    const data = await request.formData()
    const props = data.get('prop')          //GET PROPS
    if (!props) {
        return NextResponse.json({ "success": false })
    }
    //CHECK FOR DUPLICATES HERE!!!

    let obj_props = JSON.parse(props)

    const formDataEntryValues = Array.from(data.values()); // GET FILES
    let imagesArray = []
    for (const formDataEntryValue of formDataEntryValues) {
        if (typeof formDataEntryValue === "object" && "arrayBuffer" in formDataEntryValue) {
            // const path = join(process.cwd(), '/', 'public', '/', 'images', '/', 'south', file.name) // process.cwd() may be deleted
            // await writeFile(path, buffer)

            // let image_object = { src: join('/', 'images', '/', 'south', file.name), alt: file.name }
            imagesArray.push(formDataEntryValue)

        }
    }

    return new Promise((resolve, reject) => {
        const uploads = imagesArray.map((im) => UploadImage(im, "sri-lanka"))
        Promise.all(uploads).then((values) => {
            createDocument(obj_props, values)
            resolve(NextResponse.json({ "msg": values }, { status: 200 }))
        }
        ).catch((err) => reject(err))
    })

    async function createDocument(doc, images) {
        const arrayOfImages = []
        for (let i = 0; i < images.length; i++) {
            arrayOfImages.push(
                { src: images[i].secure_url, alt: images[i].original_filename, public_id: images[i].public_id }
            )
        }
        doc.images = arrayOfImages
        await Restate.create(doc)
    }

    //obj_props.images = arr
    //console.log(`props: ${JSON.stringify(obj_props)}`)




}