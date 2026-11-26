import { NextRequest, NextResponse } from "next/server";
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

    const data = await request.formData()
    const props = data.get('prop')          //GET PROPS
    if (!props) {
        return NextResponse.json({ success: false }, { status: 400 })
    }

    let obj_props;
    try {
        obj_props = JSON.parse(props)
    } catch {
        return NextResponse.json({ success: false, error: 'Invalid property payload' }, { status: 400 })
    }

    // Shared validation: rooms cap, beds, amenities, address, coordinates.
    // Fail before uploading anything to Cloudinary.
    const info = extractInfoFields(obj_props)
    if (!info.ok) {
        return NextResponse.json({ success: false, error: info.error }, { status: 400 })
    }
    obj_props = { ...obj_props, ...info.updateFields }

    const formDataEntryValues = Array.from(data.values()); // GET FILES
    let imagesArray = []
    for (const formDataEntryValue of formDataEntryValues) {
        if (typeof formDataEntryValue === "object" && "arrayBuffer" in formDataEntryValue) {
            imagesArray.push(formDataEntryValue)
        }
    }

    if (imagesArray.length > MAX_IMAGES) {
        return NextResponse.json(
            { success: false, error: `Maximum ${MAX_IMAGES} images allowed.` },
            { status: 400 }
        )
    }

    // Owner is the authenticated session, never client-supplied
    obj_props.mail = sessionEmail

    try {
        const values = await Promise.all(imagesArray.map((im) => UploadImage(im, "sri-lanka")))

        const arrayOfImages = values.map((img) => ({
            src: img.secure_url, width: img.width, height: img.height,
            alt: img.original_filename, public_id: img.public_id
        }))
        obj_props.images = arrayOfImages

        const respose = await Restate.create(obj_props)
        revalidatePath('/', 'layout')
        return NextResponse.json({ "msg": respose }, { status: 200 })
    } catch (err) {
        console.error('upload failed:', err)
        return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
    }
}
