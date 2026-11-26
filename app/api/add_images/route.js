import { NextResponse } from "next/server";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";
import { UploadImage } from "@/app/lib/upload";
import { revalidatePath } from "next/cache";
import { requireAdminEmail } from "@/auth";
import { extractInfoFields } from "@/app/lib/propertyInfo";

const MAX_IMAGES = 15;

export async function POST(request) {
    const sessionEmail = await requireAdminEmail();
    if (typeof sessionEmail !== "string") return sessionEmail; // 401 response

    await initMongoose()

    try {
        const data = await request.formData()
        const props = data.get('prop')          //GET PROPS
        if (!props) {
            return NextResponse.json({ success: false }, { status: 400 })
        }

        let obj_props = JSON.parse(props)

        if (!obj_props._id) {
            return NextResponse.json({ error: 'Missing _id' }, { status: 400 })
        }

        // Ownership: only the property owner may update it
        const doc = await Restate.findOne({ _id: obj_props._id })
        if (!doc || doc.mail !== sessionEmail) {
            return NextResponse.json({ error: 'Not found or not your property' }, { status: 403 })
        }

        // Validate the editable text fields up-front: they are persisted on
        // BOTH paths (info-only save AND image upload), so pending text edits
        // (description, room descriptions, composition) are never discarded
        // by an image operation.
        const info = extractInfoFields(obj_props)
        if (!info.ok) {
            return NextResponse.json({ success: false, error: info.error }, { status: 400 })
        }

        const formDataEntryValues = Array.from(data.values()); // GET FILES
        let imagesArray = []
        for (const formDataEntryValue of formDataEntryValues) {
            if (typeof formDataEntryValue === "object" && "arrayBuffer" in formDataEntryValue) {
                imagesArray.push(formDataEntryValue)
            }
        }

        if (imagesArray.length == 0) { //If no images included the update info
            const update_info = await Restate.updateOne({ _id: doc._id }, { $set: info.updateFields })
            revalidatePath('/', 'layout')
            return NextResponse.json({ "msg": update_info }, { status: 200 })
        }

        // Server-side TOTAL cap: existing images + new batch (client check alone is bypassable)
        const existingCount = Array.isArray(doc.images) ? doc.images.length : 0
        if (existingCount + imagesArray.length > MAX_IMAGES) {
            return NextResponse.json(
                { success: false, error: `Maximum ${MAX_IMAGES} property images allowed. You already have ${existingCount}.` },
                { status: 400 }
            )
        }

        const uploads = imagesArray.map((im) => UploadImage(im, "sri-lanka"))
        const values = await Promise.all(uploads)
        const arrayOfImages = []
        for (let i = 0; i < values.length; i++) {
            arrayOfImages.push(
                { src: values[i].secure_url, width: values[i].width, height: values[i].height, alt: values[i].original_filename, public_id: values[i].public_id }
            )
        }

        // Push the new images AND persist the pending info edits in one update
        const update = { $push: { images: { $each: arrayOfImages } } }
        if (Object.keys(info.updateFields).length > 0) update.$set = info.updateFields
        await Restate.updateOne({ _id: doc._id }, update)
        revalidatePath('/', 'layout')
        return NextResponse.json({ "msg": values }, { status: 200 })
    } catch (err) {
        console.error('add_images failed:', err)
        return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 })
    }
}
