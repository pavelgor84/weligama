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

  // ---- future filters go here ----
  // minPrice:  { field: 'price',     op: '$gte', type: 'number' },
  // roomsMin:  { field: 'rooms',     op: '$gte', type: 'number' },
  // available: { field: 'available', op: 'eq',   type: 'boolean' },
  // type:      { field: 'type',      op: 'eq',   type: 'string' },
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
