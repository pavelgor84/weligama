import { NextRequest, NextResponse } from "next/server";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";
import { UploadImage } from "@/app/lib/upload";
import { revalidatePath } from "next/cache";


export async function POST(request) {
    await initMongoose()

    const data = await request.formData()
    const props = data.get('prop')          //GET PROPS
    if (!props) {
        return NextResponse.json({ "success": false })
    }

    let obj_props = JSON.parse(props)

    const formDataEntryValues = Array.from(data.values()); // GET FILES
    let imagesArray = []
    for (const formDataEntryValue of formDataEntryValues) {
        if (typeof formDataEntryValue === "object" && "arrayBuffer" in formDataEntryValue) {

            imagesArray.push(formDataEntryValue)

        }
    }


    if (imagesArray.length == 0) {
        updateInfo(obj_props)
    }

    return new Promise((resolve, reject) => {
        const uploads = imagesArray.map((im) => UploadImage(im, "sri-lanka"))
        Promise.all(uploads).then((values) => {
            updateImages(obj_props, values)
            resolve(NextResponse.json({ "msg": values }, { status: 200 }))
        }
        ).catch((err) => reject(err))
    })

    async function updateImages(doc, images) {

        for (let i = 0; i < images.length; i++) {
            doc.images.push(
                { src: images[i].secure_url, width: images[i].width, height: images[i].height, alt: images[i].original_filename, public_id: images[i].public_id }
            )
        }
        console.log(doc)
        await Restate.updateOne({ _id: doc._id }, { $set: doc })
    }

    async function updateInfo(doc) {
        const update_info = await Restate.updateOne({ _id: doc._id }, { $set: doc })
        revalidatePath('/', 'layout')
        return NextResponse.json({ "msg": update_info }, { status: 200 })

    }





}