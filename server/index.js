import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { OAuth2Client } from 'google-auth-library'
import { z } from 'zod'
import { createStore } from './db.js'

dotenv.config()

const app = express()
const store = await createStore()
const port = Number(process.env.PORT ?? 8787)
const isProduction = process.env.NODE_ENV === 'production'
const adminToken = process.env.ADMIN_TOKEN?.trim()
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()
const googleAuthClient = googleClientId ? new OAuth2Client(googleClientId) : null
const defaultCorsOrigin = isProduction ? false : true

const categoryOptions = [
  'Cafe / Coffee Shop',
  'Coworking Space',
  'Library',
  'Campus Lounge',
  'Restaurant',
  'Rest Area',
]

const placeSubmissionSchema = z.object({
  name: z.string().min(3).max(120),
  category: z.enum(categoryOptions),
  address: z.string().min(6).max(180),
  district: z.string().min(2).max(80),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  wifiAvailable: z.boolean().default(true),
  wifiAccessType: z.string().max(80).optional().nullable(),
  wifiPassword: z.string().max(80).optional().nullable(),
  passwordSource: z.string().max(80).optional().nullable(),
  accessNotes: z.string().max(220).optional().nullable(),
  wifiSpeedMbps: z.number().min(0).max(1000).nullable().optional(),
  uploadMbps: z.number().min(0).max(1000).nullable().optional(),
  pingMs: z.number().int().min(0).max(1000).nullable().optional(),
  hasPowerOutlets: z.boolean().default(false),
  open24Hours: z.boolean().default(false),
  quietZone: z.boolean().default(false),
  ambienceLabel: z.string().max(40).optional().nullable(),
  mapContext: z.string().max(180).optional().nullable(),
  operatingHours: z.string().max(180).optional().nullable(),
  imageTone: z.string().max(40).optional().nullable(),
  imageUrl: z.union([z.string().url().max(500), z.literal(''), z.null()]).optional(),
  submitterName: z.string().min(2).max(80),
  submitterEmail: z.union([z.string().email().max(120), z.literal(''), z.null()]).optional(),
}).superRefine((value, ctx) => {
  if (value.wifiPassword && !value.passwordSource) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'password_source wajib saat password WiFi diisi',
      path: ['passwordSource'],
    })
  }
})

const reviewSchema = z.object({
  placeId: z.number().int().positive(),
  authorName: z.string().min(2).max(80),
  authorEmail: z.string().email().max(120),
  reviewTitle: z.string().min(4).max(100),
  ratingSpeed: z.number().int().min(1).max(5),
  ratingComfort: z.number().int().min(1).max(5),
  imageUrl: z.union([z.string().url().max(500), z.string().startsWith('data:image/').max(900_000), z.literal(''), z.null()]).optional(),
  comment: z.string().min(12).max(400),
})

const moderationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
})

function parseBoolean(value, defaultValue = false) {
  if (value === undefined) {
    return defaultValue
  }

  if (typeof value === 'boolean') {
    return value
  }

  return String(value).toLowerCase() === 'true'
}

function cleanNullableString(value) {
  if (typeof value !== 'string') {
    return value ?? null
  }

  const cleaned = value.trim().replace(/\s+/g, ' ')
  return cleaned.length ? cleaned : null
}

function parseJson(schema, body) {
  return schema.parse({
    ...body,
    wifiPassword: cleanNullableString(body.wifiPassword),
    passwordSource: cleanNullableString(body.passwordSource),
    wifiAccessType: cleanNullableString(body.wifiAccessType),
    accessNotes: cleanNullableString(body.accessNotes),
    ambienceLabel: cleanNullableString(body.ambienceLabel),
    mapContext: cleanNullableString(body.mapContext),
    operatingHours: cleanNullableString(body.operatingHours),
    imageTone: cleanNullableString(body.imageTone),
    imageUrl: cleanNullableString(body.imageUrl),
    submitterEmail: cleanNullableString(body.submitterEmail),
  })
}

function parseLimit(value, defaultValue = 100) {
  if (value === undefined) {
    return defaultValue
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return defaultValue
  }

  return Math.min(Math.max(Math.trunc(parsed), 1), 100)
}

function requireAdmin(request, response, next) {
  if (!adminToken) {
    if (isProduction) {
      response.status(503).json({ error: 'Admin access is not configured' })
      return
    }

    next()
    return
  }

  const authHeader = request.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

  if (token !== adminToken) {
    response.status(401).json({ error: 'Unauthorized' })
    return
  }

  next()
}

function readBearerToken(request) {
  const authHeader = request.get('authorization') ?? ''
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
}

async function requireGoogleUser(request, response, next) {
  if (!googleAuthClient || !googleClientId) {
    response.status(503).json({ error: 'Google login is not configured on the API server' })
    return
  }

  const token = readBearerToken(request)

  if (!token) {
    response.status(401).json({ error: 'Google login is required' })
    return
  }

  try {
    const ticket = await googleAuthClient.verifyIdToken({
      idToken: token,
      audience: googleClientId,
    })
    const payload = ticket.getPayload()

    if (!payload?.email || payload.email_verified === false) {
      response.status(401).json({ error: 'Google account email is not verified' })
      return
    }

    request.googleUser = {
      name: payload.name || payload.email,
      email: payload.email,
      picture: payload.picture,
    }
    next()
  } catch {
    response.status(401).json({ error: 'Invalid Google login token' })
  }
}

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : defaultCorsOrigin,
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', async (_request, response) => {
  response.json({
    status: 'ok',
    mode: store.mode,
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/places', async (request, response, next) => {
  try {
    const filters = {
      q: request.query.q,
      category: request.query.category,
      accessType: request.query.accessType,
      speed: request.query.speed,
      outlets: parseBoolean(request.query.outlets),
      open24: parseBoolean(request.query.open24),
      wifiAvailable: parseBoolean(request.query.wifi, true),
      status: request.query.status,
      limit: parseLimit(request.query.limit),
    }

    const places = await store.listPlaces(filters)
    response.json({
      data: places,
      meta: {
        source: store.mode,
        count: places.length,
      },
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/places/:id', async (request, response, next) => {
  try {
    const place = await store.getPlaceById(Number(request.params.id))

    if (!place) {
      response.status(404).json({ error: 'Place not found' })
      return
    }

    response.json({
      data: place,
      meta: {
        source: store.mode,
      },
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/places', requireGoogleUser, async (request, response, next) => {
  try {
    const parsed = parseJson(placeSubmissionSchema, {
      ...request.body,
      submitterName: request.googleUser.name,
      submitterEmail: request.googleUser.email,
    })
    const submission = await store.createPlaceSubmission(parsed)

    response.status(201).json({
      data: submission,
      message: 'Spot submitted for moderation',
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/reviews', requireGoogleUser, async (request, response, next) => {
  try {
    const parsed = reviewSchema.parse({
      ...request.body,
      authorName: request.googleUser.name,
      authorEmail: request.googleUser.email,
    })
    const review = await store.createReview(parsed)

    response.status(201).json({
      data: review,
      message: 'Review published',
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/submissions', requireAdmin, async (_request, response, next) => {
  try {
    const data = await store.listAdminSubmissions()
    response.json({
      data,
      meta: {
        source: store.mode,
      },
    })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/admin/submissions/:id', requireAdmin, async (request, response, next) => {
  try {
    const parsed = moderationSchema.parse(request.body)
    const updated = await store.updateSubmissionStatus(Number(request.params.id), parsed.status)

    if (!updated) {
      response.status(404).json({ error: 'Submission not found' })
      return
    }

    response.json({
      data: updated,
      message: `Submission ${parsed.status}`,
    })
  } catch (error) {
    next(error)
  }
})

app.use((error, _request, response, next) => {
  void next

  if (error instanceof z.ZodError) {
    response.status(400).json({
      error: 'Validation failed',
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    })
    return
  }

  console.error(error)
  response.status(500).json({ error: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`BalamWiFi API running on http://localhost:${port} (${store.mode})`)
})
