import { NextResponse } from "next/server";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";
import { DeleteImage } from "@/app/lib/delete";
import { revalidatePath } from "next/cache";
import { requireAdminEmail } from "@/auth";

export async function POST(request) {
    const sessionEmail = await requireAdminEmail();
    if (typeof sessionEmail !== "string") return sessionEmail; // 401 response

    await initMongoose()

    const body = await request.json()

    try {
        if (!body?._id) {
            return NextResponse.json({ error: 'Missing _id' }, { status: 400 })
        }

        // Ownership: fetch the doc first (validates _id and checks owner)
        const doc = await Restate.findOne({ _id: body._id })
        if (!doc || doc.mail !== sessionEmail) {
            return NextResponse.json({ error: 'Not found or not your property' }, { status: 403 })
        }

        // room_images: flat array of room images; villa_images: flat array of property images
        const room_images = Array.isArray(body.rooms) ? body.rooms.flat() : []
        const villa_images = Array.isArray(body.images) ? body.images : []
        const all_filtered_images = [...room_images, ...villa_images].filter((item) => item && item.public_id)

        if (all_filtered_images.length == 0) {
            // No images to clean up — delete the document directly
            // (was: Restate.deleteOne({ _id: doc }) with undefined `doc` → ReferenceError)
            const respose = await Restate.deleteOne({ _id: body._id })
            revalidatePath('/', 'layout')
            return NextResponse.json({ "msg": respose }, { status: 200 })
        }

        // Collect every public_id directly (room_images is already flat)
        const ids_to_delete = all_filtered_images.map((item) => item.public_id)

        await Promise.all(ids_to_delete.map((im) => DeleteImage(im)))

        const respose = await Restate.deleteOne({ _id: body._id })
        revalidatePath('/', 'layout')
        return NextResponse.json({ "msg": respose }, { status: 200 })
    } catch (err) {
        console.error('delete_asset failed:', err)
        return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 })
    }
}
