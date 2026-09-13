import { NextResponse } from "next/server";
import { initMongoose } from "@/db/mongoose";
import Restate from "@/models/Restate";
import { buildFilterQuery } from "@/utils/filters";

// export async function handle(req, res) {
//     await initMongoose()
//     res.json(await Restate.find().exec())
// }

export async function GET(request) {
    await initMongoose()

    const { searchParams } = new URL(request.url)
    const minLng  = parseFloat(searchParams.get('minLng'))
    const maxLng  = parseFloat(searchParams.get('maxLng'))
    const minLat  = parseFloat(searchParams.get('minLat'))
    const maxLat  = parseFloat(searchParams.get('maxLat'))
    const zoom    = parseInt(searchParams.get('zoom'), 10) || null
    const page    = parseInt(searchParams.get('page') || '1', 10)
    const limit   = parseInt(searchParams.get('limit') || '50', 10)

    if (isNaN(minLng) || isNaN(maxLng) || isNaN(minLat) || isNaN(maxLat)) {
        return NextResponse.json({ error: 'Missing or invalid bounding-box params' }, { status: 400 })
    }

    // Whitelisted, typed filters (e.g. ?maxPrice=1000) merged into the base query.
    // See utils/filters.js — add future filters there, not here.
    const priceFilter = buildFilterQuery(Object.fromEntries(searchParams))

    const filter = {
        available: true,
        ...priceFilter,
        coordinates: {
            $geoWithin: {
                $box: [[minLng, minLat], [maxLng, maxLat]]   // GeoJSON order: [lng, lat]
            }
        }
    }

    const projection  = { coordinates: 1, _id: 1, price: 1 }
    const skip        = (page - 1) * limit

    const data = await Restate.find(filter, projection).skip(skip).limit(limit).exec()

    return NextResponse.json({ data, page })
}