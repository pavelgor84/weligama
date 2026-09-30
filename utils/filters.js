/**
 * Centralized, extensible filter builder for API routes.
 *
 * Design: flat, whitelisted query params -> Mongoose filter object.
 * - Adding a future filter = add ONE entry to FILTER_WHITELIST below,
 *   then add the param to the client's fetch URL. No route rewrites.
 * - Unknown params are ignored (no NoSQL injection — field names come
 *   only from the whitelist, never from user input).
 * - Number params are validated (Number.isFinite) to avoid CastError.
 * - Range ops on the same field merge (e.g. $gte + $lte on price).
 */

const FILTER_WHITELIST = {
  // param name  -> { field, op, type }
  maxPrice: { field: 'price', op: '$lte', type: 'number' },

  // Amenities filter (tag source: components/amenityFilter/amenityTags.js)
  ac:      { field: 'ac',      op: 'eq',  type: 'boolean' },
  parking: { field: 'parking', op: 'eq',  type: 'boolean' },
  view:    { field: 'view',    op: '$in', type: 'string' },

  // Room count filter (tag source: components/amenityFilter/amenityTags.js)
  availableRooms: { field: 'availableRooms', op: '$gte', type: 'number' },

  // Bed filter — ?beds=<count>:<bedType>:<scope>
  // (tag source: components/amenityFilter/amenityTags.js, BED_TAGS)
  beds: { field: 'rooms_info', op: 'beds', type: 'string' },

  // ---- future filters go here ----
  // minPrice:  { field: 'price',     op: '$gte', type: 'number' },
  // roomsMin:  { field: 'rooms',     op: '$gte', type: 'number' },
  // available: { field: 'available', op: 'eq',   type: 'boolean' },
  // type:      { field: 'type',      op: 'eq',   type: 'string' },
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Build the $expr predicate for the universal bed filter.
 *
 * Spec: { count, bedType, scope }
 *   count   — minimum number of beds required (integer >= 1)
 *   bedType — 'any' or one schema enum value; matched case-insensitively
 *   scope   — 'room': all required beds must be in ONE room
 *             'property': beds may be spread across any rooms
 *
 * Returns null when the spec is invalid (caller skips the clause).
 */
function buildBedFilter({ count, bedType, scope }) {
  const n = Number(count)
  if (!Number.isInteger(n) || n < 1) return null
  const type = String(bedType ?? 'any').trim().toLowerCase()
  const inRoom = scope === 'room'

  // Number of matching beds inside one room. `roomVar` is the current-element
  // variable of the enclosing operator ('$$room' for $filter, '$$this' for $reduce).
  const roomBedCount = (roomVar) => ({
    $size: {
      $filter: {
        input: { $ifNull: [`${roomVar}.beds`, []] },
        as: 'bed',
        cond: type === 'any' ? true : { $eq: [{ $toLower: '$$bed' }, type] },
      },
    },
  })

  if (inRoom) {
    // At least one room holds >= n matching beds.
    return {
      $expr: {
        $gt: [
          {
            $size: {
              $filter: {
                input: { $ifNull: ['$rooms_info', []] },
                as: 'room',
                cond: { $gte: [roomBedCount('$$room'), n] },
              },
            },
          },
          0,
        ],
      },
    }
  }

  // Total matching beds across ALL rooms >= n.
  const total = {
    $reduce: {
      input: { $ifNull: ['$rooms_info', []] },
      initialValue: 0,
      in: { $add: ['$$value', roomBedCount('$$this')] },
    },
  }
  return { $expr: { $gte: [total, n] } }
}

/**
 * Build a Mongoose filter object from URL search params.
 * @param {Record<string,string>} params - plain object of query params
 * @returns {object} filter object (safe to spread into find())
 */
export function buildFilterQuery(params) {
  const filter = {}
  for (const [param, def] of Object.entries(FILTER_WHITELIST)) {
    const raw = params[param]
    if (raw === undefined || raw === null || raw === '') continue

    // Bed filter — ?beds=<count>:<bedType>:<scope>, e.g. beds=2:any:room.
    // Universal predicate over rooms_info.beds; invalid specs are skipped.
    if (def.op === 'beds') {
      const [count, bedType = 'any', scope = 'room'] = String(raw).split(':').map((s) => s.trim())
      const clause = buildBedFilter({ count, bedType, scope })
      if (clause) filter.$expr = clause.$expr
      continue
    }

    // Simple equality (numbers, booleans, strings)
    if (def.op === 'eq') {
      if (def.type === 'number') {
        const n = Number(raw)
        if (Number.isFinite(n)) filter[def.field] = n
      } else if (def.type === 'boolean') {
        filter[def.field] = raw === 'true' || raw === '1'
      } else {
        filter[def.field] = String(raw)
      }
      continue
    }

    // $in — comma-separated list of strings (e.g. view=Ocean,City).
    // `view` is free text in the DB, so each value is matched with an
    // anchored case-insensitive regex: a stray lowercase "garden" still
    // matches the curated "Garden" tag.
    if (def.op === '$in') {
      const values = String(raw)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (values.length > 0) {
        filter[def.field] = { $in: values.map((v) => new RegExp(`^${escapeRegExp(v)}$`, 'i')) }
      }
      continue
    }

    // Range operators ($lte / $gte) — validated numbers, merged per field
    const n = Number(raw)
    if (!Number.isFinite(n)) continue
    if (filter[def.field] && typeof filter[def.field] === 'object') {
      filter[def.field][def.op] = n
    } else {
      filter[def.field] = { [def.op]: n }
    }
  }
  return filter
}
