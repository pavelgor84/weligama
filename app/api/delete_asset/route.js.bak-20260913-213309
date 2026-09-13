import { NextRequest, NextResponse } from "next/server";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";
import { DeleteImage } from "@/app/lib/delete";
import { revalidatePath } from "next/cache";



export async function POST(request) {
    await initMongoose()

    const body = await request.json()

    let room_images = body.rooms.flat() // flat array of room images
    room_images.push(...body.images) // add villa images to to room images
    let all_filtered_images = room_images.filter((item) => { // check for images
        return item.public_id
    })
    if (all_filtered_images.length == 0) {
        let respose = await Restate.deleteOne({ _id: doc })
        revalidatePath('/', 'layout')
        return NextResponse.json({ "msg": respose }, { status: 200 })
    }

    //console.log(body.images)
    const images_array = []

    function extract_images(array) {
        for (let i = 0; i < array.length; i++) {
            if (array[i].length) {
                for (let j = 0; j < array[i].length; j++) {
                    images_array.push(array[i][j].public_id)
                }
            }
        }
        console.log(images_array)
    }

    extract_images([body.images, room_images])


    return new Promise((resolve, reject) => {
        const for_delete = images_array.map((im) => DeleteImage(im))
        Promise.all(for_delete).then((values) => {
            deleteDocument(body._id, values, resolve)

        }
        ).catch((err) => reject(err))
    })

    async function deleteDocument(doc, rez, resolve) {
        //console.log(images)
        let respose = await Restate.deleteOne({ _id: doc })
        revalidatePath('/', 'layout')
        resolve(NextResponse.json({ "msg": respose }, { "result": rez }, { status: 200 }))
    }

    // const result_delete = await DeleteImage(body.delete.public_id)
    // console.log(result_delete)


    // const update_db = await Restate.updateOne({ _id: body._id }, { $set: body })
    // console.log(update_db)

    //return NextResponse.json({ "success": true })


}