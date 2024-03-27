import { NextRequest, NextResponse } from "next/server";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";
import { UploadImage } from "@/app/lib/upload";


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

    return new Promise((resolve, reject) => {
        const uploads = imagesArray.map((im) => UploadImage(im, "sri-lanka"))
        Promise.all(uploads).then((values) => {
            editDocument(obj_props, values)
            resolve(NextResponse.json({ "msg": values }, { status: 200 }))
        }
        ).catch((err) => reject(err))
    })

    async function editDocument(doc, images) {

        for (let i = 0; i < images.length; i++) {
            doc.images.push(
                { src: images[i].secure_url, alt: images[i].original_filename, public_id: images[i].public_id }
            )
        }
        console.log(doc)
        await Restate.updateOne({ _id: doc._id }, { $set: doc })
    }

    //obj_props.images = arr
    //console.log(`props: ${JSON.stringify(obj_props)}`)




}