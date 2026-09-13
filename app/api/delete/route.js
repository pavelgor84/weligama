import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";
import { DeleteImage } from "@/app/lib/delete";
import { revalidatePath } from "next/cache";


export async function POST(request) {
    await initMongoose()

    const body = await request.json()
    //const path = join(process.cwd(), '/', 'public', body.delete.src) // process.cwd() may be deleted
    //console.log(body)

    try {
        const result_delete = await DeleteImage(body.delete.public_id)
        console.log(result_delete)

        // Only update specific fields that were modified by the delete operation,
        // NOT the entire body (which contains UI-formatted values like coordinates as string)
        const updateFields = {}
        if (Array.isArray(body.images)) updateFields.images = body.images
        if (Array.isArray(body.rooms)) updateFields.rooms = body.rooms
        if (Array.isArray(body.rooms_info)) updateFields.rooms_info = body.rooms_info
        if (Array.isArray(body.occupied_rooms)) updateFields.occupied_rooms = body.occupied_rooms

        const update_db = await Restate.updateOne({ _id: body._id }, { $set: updateFields })
        console.log(update_db)
        revalidatePath('/', 'layout')

        return NextResponse.json({ "success": true })
    } catch (err) {
        console.error('Delete failed:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }

}