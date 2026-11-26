import { NextResponse } from "next/server";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";
import { DeleteImage } from "@/app/lib/delete";
import { revalidatePath } from "next/cache";
import { requireAdminEmail } from "@/auth";
import { extractInfoFields, MAX_ROOMS } from "@/app/lib/propertyInfo";

export async function POST(request) {
    const sessionEmail = await requireAdminEmail();
    if (typeof sessionEmail !== "string") return sessionEmail; // 401 response

    await initMongoose()

    const body = await request.json()

    try {
        // A request must carry something to delete: one image (property or
        // room) or a room removal (deleteRoomImages present, possibly empty
        // when the removed room had no photos).
        const hasSingleImage = Boolean(body?.delete?.public_id)
        const isRoomRemoval = Array.isArray(body?.deleteRoomImages)
        const hasRoomImages = isRoomRemoval && body.deleteRoomImages.length > 0
        if (!body?._id || (!hasSingleImage && !isRoomRemoval)) {
            return NextResponse.json({ error: 'Missing _id or delete payload' }, { status: 400 })
        }

        // Ownership: only the property owner may delete its images
        const doc = await Restate.findOne({ _id: body._id })
        if (!doc || doc.mail !== sessionEmail) {
            return NextResponse.json({ error: 'Not found or not your property' }, { status: 403 })
        }

        // Validate the editable text fields BEFORE deleting assets in
        // Cloudinary — the client sends its current state together with the
        // deletion, so pending description/composition edits are saved here
        // instead of being discarded.
        const info = extractInfoFields(body)
        if (!info.ok) {
            return NextResponse.json({ error: info.error }, { status: 400 })
        }

        // Only update fields that were modified by the delete operation, NOT
        // the entire body (which contains UI-formatted values like coordinates
        // as string — those are normalized by extractInfoFields above).
        const updateFields = { ...info.updateFields }
        if (Array.isArray(body.images)) updateFields.images = body.images
        if (Array.isArray(body.rooms)) updateFields.rooms = body.rooms

        // Server-side cap: total rooms (max(1, added)) must not exceed MAX_ROOMS
        if ((Array.isArray(updateFields.rooms) && updateFields.rooms.length > MAX_ROOMS) ||
            (Array.isArray(updateFields.rooms_info) && updateFields.rooms_info.length > MAX_ROOMS)) {
            return NextResponse.json({ error: `Maximum ${MAX_ROOMS} rooms per property allowed.` }, { status: 400 })
        }

        // Cloudinary cleanup: single image, and/or every image of a deleted room
        if (hasSingleImage) {
            const result_delete = await DeleteImage(body.delete.public_id)
            console.log(result_delete)
        }
        if (hasRoomImages) {
            const roomIds = body.deleteRoomImages.filter((id) => typeof id === 'string' && id)
            await Promise.all(roomIds.map((id) => DeleteImage(id)))
        }

        const update_db = await Restate.updateOne({ _id: body._id }, { $set: updateFields })
        console.log(update_db)
        revalidatePath('/', 'layout')

        return NextResponse.json({ "success": true })
    } catch (err) {
        console.error('Delete failed:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }

}
