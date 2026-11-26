import { NextResponse } from "next/server";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";
import { UploadImage } from "@/app/lib/upload";
import { requireAdminEmail } from "@/auth";
import { extractInfoFields, MAX_ROOMS } from "@/app/lib/propertyInfo";

const MAX_IMAGES_PER_ROOM = 15;

export async function POST(request) {
    const sessionEmail = await requireAdminEmail();
    if (typeof sessionEmail !== "string") return sessionEmail; // 401 response

    await initMongoose()

    try {
        const data = await request.formData()
        const props = data.get('room')          //GET PROPS
        if (!props) {
            return NextResponse.json({ success: false }, { status: 400 })
        }

        let obj_props;
        try {
            obj_props = JSON.parse(props)
        } catch {
            return NextResponse.json({ success: false, error: 'Invalid room payload' }, { status: 400 })
        }
        console.log(`PROPS ${obj_props.id}, ${obj_props.room}`)

        const roomIndex = Number(obj_props.room)
        if (!Number.isInteger(roomIndex) || roomIndex < 0) {
            return NextResponse.json({ success: false, error: 'Invalid room index' }, { status: 400 })
        }

        // Server-side cap: total rooms (max(1, added)) must not exceed MAX_ROOMS,
        // so the highest valid index for an added room is MAX_ROOMS - 1
        if (roomIndex >= MAX_ROOMS) {
            return NextResponse.json(
                { success: false, error: `Maximum ${MAX_ROOMS} rooms per property allowed.` },
                { status: 400 }
            )
        }

        if (!obj_props.id) {
            return NextResponse.json({ error: 'Missing property id' }, { status: 400 })
        }

        // Optional property payload: pending text edits (property/room
        // descriptions, composition) travel with the upload so they are saved
        // instead of being lost when the client re-fetches from the DB.
        let infoFields = null
        const propPayload = data.get('prop')
        if (propPayload) {
            let parsedProp;
            try {
                parsedProp = JSON.parse(propPayload)
            } catch {
                return NextResponse.json({ success: false, error: 'Invalid property payload' }, { status: 400 })
            }
            const info = extractInfoFields(parsedProp)
            if (!info.ok) {
                return NextResponse.json({ success: false, error: info.error }, { status: 400 })
            }
            infoFields = info.updateFields
        }

        // Ownership: only the property owner may upload to its rooms
        const doc = await Restate.findOne({ _id: obj_props.id }).lean()
        if (!doc || doc.mail !== sessionEmail) {
            return NextResponse.json({ error: 'Not found or not your property' }, { status: 403 })
        }

        const formDataEntryValues = Array.from(data.values()); // GET FILES
        let imagesArray = []
        for (const formDataEntryValue of formDataEntryValues) {
            if (typeof formDataEntryValue === "object" && "arrayBuffer" in formDataEntryValue) {
                imagesArray.push(formDataEntryValue)
            }
        }

        // Server-side TOTAL cap: existing room images + new batch (client check alone is bypassable)
        const existingCount = Array.isArray(doc.rooms?.[roomIndex]) ? doc.rooms[roomIndex].length : 0
        if (existingCount + imagesArray.length > MAX_IMAGES_PER_ROOM) {
            return NextResponse.json(
                { success: false, error: `Maximum ${MAX_IMAGES_PER_ROOM} images per room allowed. Room ${roomIndex + 1} already has ${existingCount}.` },
                { status: 400 }
            )
        }

        const uploads = imagesArray.map((im) => UploadImage(im, "sri-lanka"))
        const values = await Promise.all(uploads)
        const arrayOfImages = []
        for (let i = 0; i < values.length; i++) {
            arrayOfImages.push(
                { room_number: obj_props.room, src: values[i].secure_url, width: values[i].width, height: values[i].height, alt: values[i].original_filename, public_id: values[i].public_id }
            )
        }

        // Build the full rooms array instead of $push into `rooms.<index>`:
        // a room added in the edit form has no image array yet, and $push on a
        // gap would pad the array with nulls.
        const rooms = Array.isArray(doc.rooms)
            ? doc.rooms.map((roomImages) => Array.isArray(roomImages) ? roomImages : [])
            : []
        while (rooms.length <= roomIndex) rooms.push([])
        rooms[roomIndex] = [...rooms[roomIndex], ...arrayOfImages]

        const update = { $set: { rooms } }
        if (infoFields && Object.keys(infoFields).length > 0) {
            Object.assign(update.$set, infoFields)
        }

        const response = await Restate.updateOne({ _id: doc._id }, update)

        return NextResponse.json({ "msg": response }, { status: 200 })
    } catch (err) {
        console.error('upload_room failed:', err)
        return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
    }
}
