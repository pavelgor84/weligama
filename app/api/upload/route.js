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
    //CHECK FOR DUPLICATES HERE!!!

    let obj_props = JSON.parse(props)
    //console.log(obj_props)

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
            createDocument(obj_props, values, resolve)

        }
        ).catch((err) => reject(err))
    })

    async function createDocument(doc, images, resolve) {
        //console.log(images)
        const arrayOfImages = []
        for (let i = 0; i < images.length; i++) {
            arrayOfImages.push(
                { src: images[i].secure_url, width: images[i].width, height: images[i].height, alt: images[i].original_filename, public_id: images[i].public_id }
            )
        }
        doc.images = arrayOfImages
        let respose = await Restate.create(doc)
        resolve(NextResponse.json({ "msg": respose }, { "images": images }, { status: 200 }))
    }






}