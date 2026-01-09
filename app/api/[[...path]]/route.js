import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// MongoDB connection
let client
let db

const JWT_SECRET = process.env.JWT_SECRET || 'expertbridge-secret-key-2024'

const CATEGORIES = [
  'Psychologist', 'Lawyer', 'Financial Advisor', 'Career Coach',
  'Business Consultant', 'Physiotherapist', 'Nutritionist',
  'Accountant', 'Architect', 'Marriage Counselor', 'Tax Consultant',
  'Real Estate Agent', 'IT Consultant', 'Marketing Consultant',
  'HR Consultant', 'Life Coach', 'Immigration Consultant',
  'Event Planner', 'Interior Designer', 'Education Consultant'
]

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME || 'expertbridge')
  }
  return db
}

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// Verify JWT token
function verifyToken(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.split(' ')[1]
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // Root endpoint
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'ExpertBridge API v1.0', categories: CATEGORIES }))
    }

    // ==================== AUTH ROUTES ====================
    
    // Professional Registration
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json()
      const { fullName, email, phone, password, category, subcategory, bio, experience, location, serviceOptions, languages, socialLinks } = body

      if (!fullName || !email || !password || !category || !bio || !experience || !location) {
        return handleCORS(NextResponse.json({ error: 'Missing required fields' }, { status: 400 }))
      }

      // Check if email already exists
      const existingUser = await db.collection('professionals').findOne({ email: email.toLowerCase() })
      if (existingUser) {
        return handleCORS(NextResponse.json({ error: 'Email already registered' }, { status: 400 }))
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const professionalId = uuidv4()

      const professional = {
        id: professionalId,
        fullName,
        email: email.toLowerCase(),
        phone: phone || '',
        password: hashedPassword,
        category,
        subcategory: subcategory || '',
        bio,
        experience: parseInt(experience),
        location: {
          country: location.country || '',
          state: location.state || '',
          city: location.city || ''
        },
        serviceOptions: {
          inPerson: serviceOptions?.inPerson || false,
          virtual: serviceOptions?.virtual || true,
          serviceRadius: serviceOptions?.serviceRadius || 'city'
        },
        languages: languages || ['English'],
        socialLinks: socialLinks || {},
        profilePhoto: {
          url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3b82f6&color=fff&size=200`,
          publicId: null
        },
        verification: {
          status: 'pending',
          idCard: null,
          certificate: null,
          officePhoto: null,
          additionalDocs: [],
          rejectionReason: null,
          verifiedAt: null,
          verifiedBy: null
        },
        featured: {
          isFeatured: false,
          featuredUntil: null,
          featuredTier: 'basic'
        },
        analytics: {
          profileViews: 0,
          contactClicks: 0,
          lastViewedAt: null
        },
        ratings: {
          average: 0,
          count: 0
        },
        isActive: true,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('professionals').insertOne(professional)

      const token = jwt.sign({ id: professionalId, email: professional.email, role: 'professional' }, JWT_SECRET, { expiresIn: '7d' })

      const { password: _, ...safeData } = professional
      return handleCORS(NextResponse.json({ message: 'Registration successful', token, professional: safeData }))
    }

    // Professional Login
    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json()
      const { email, password } = body

      if (!email || !password) {
        return handleCORS(NextResponse.json({ error: 'Email and password required' }, { status: 400 }))
      }

      const professional = await db.collection('professionals').findOne({ email: email.toLowerCase() })
      if (!professional) {
        return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }))
      }

      const isMatch = await bcrypt.compare(password, professional.password)
      if (!isMatch) {
        return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }))
      }

      const token = jwt.sign({ id: professional.id, email: professional.email, role: 'professional' }, JWT_SECRET, { expiresIn: '7d' })

      const { password: _, ...safeData } = professional
      return handleCORS(NextResponse.json({ message: 'Login successful', token, professional: safeData }))
    }

    // Admin Login
    if (route === '/auth/admin/login' && method === 'POST') {
      const body = await request.json()
      const { email, password } = body

      if (!email || !password) {
        return handleCORS(NextResponse.json({ error: 'Email and password required' }, { status: 400 }))
      }

      const admin = await db.collection('admins').findOne({ email: email.toLowerCase() })
      if (!admin) {
        // Create default admin if not exists
        if (email === 'admin@expertbridge.com' && password === 'admin123') {
          const adminId = uuidv4()
          const hashedPassword = await bcrypt.hash('admin123', 10)
          const newAdmin = {
            id: adminId,
            email: 'admin@expertbridge.com',
            password: hashedPassword,
            fullName: 'Super Admin',
            role: 'superadmin',
            isActive: true,
            createdAt: new Date()
          }
          await db.collection('admins').insertOne(newAdmin)
          const token = jwt.sign({ id: adminId, email: newAdmin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' })
          return handleCORS(NextResponse.json({ message: 'Login successful', token, admin: { id: adminId, email: newAdmin.email, fullName: newAdmin.fullName, role: newAdmin.role } }))
        }
        return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }))
      }

      const isMatch = await bcrypt.compare(password, admin.password)
      if (!isMatch) {
        return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }))
      }

      const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' })
      return handleCORS(NextResponse.json({ message: 'Login successful', token, admin: { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role } }))
    }

    // Get current user
    if (route === '/auth/me' && method === 'GET') {
      const user = verifyToken(request)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      if (user.role === 'professional') {
        const professional = await db.collection('professionals').findOne({ id: user.id })
        if (!professional) {
          return handleCORS(NextResponse.json({ error: 'User not found' }, { status: 404 }))
        }
        const { password: _, ...safeData } = professional
        return handleCORS(NextResponse.json({ user: safeData, role: 'professional' }))
      } else if (user.role === 'admin') {
        const admin = await db.collection('admins').findOne({ id: user.id })
        if (!admin) {
          return handleCORS(NextResponse.json({ error: 'User not found' }, { status: 404 }))
        }
        const { password: _, ...safeData } = admin
        return handleCORS(NextResponse.json({ user: safeData, role: 'admin' }))
      }

      return handleCORS(NextResponse.json({ error: 'Invalid user role' }, { status: 400 }))
    }

    // ==================== PROFESSIONAL ROUTES ====================

    // Get all professionals (public)
    if (route === '/professionals' && method === 'GET') {
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page')) || 1
      const limit = parseInt(url.searchParams.get('limit')) || 12
      const featured = url.searchParams.get('featured') === 'true'

      const query = { 'verification.status': 'approved', isActive: true }
      if (featured) {
        query['featured.isFeatured'] = true
        query['featured.featuredUntil'] = { $gt: new Date() }
      }

      const total = await db.collection('professionals').countDocuments(query)
      const professionals = await db.collection('professionals')
        .find(query)
        .project({ password: 0 })
        .sort({ 'featured.isFeatured': -1, 'ratings.average': -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray()

      return handleCORS(NextResponse.json({
        professionals,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }))
    }

    // Get single professional (public)
    if (route.match(/^\/professionals\/[^/]+$/) && method === 'GET') {
      const professionalId = path[1]
      const professional = await db.collection('professionals').findOne({ id: professionalId })

      if (!professional) {
        return handleCORS(NextResponse.json({ error: 'Professional not found' }, { status: 404 }))
      }

      // Increment view count
      await db.collection('professionals').updateOne(
        { id: professionalId },
        { $inc: { 'analytics.profileViews': 1 }, $set: { 'analytics.lastViewedAt': new Date() } }
      )

      // Get reviews
      const reviews = await db.collection('reviews')
        .find({ professionalId, status: 'approved' })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray()

      const { password: _, ...safeData } = professional
      return handleCORS(NextResponse.json({ professional: safeData, reviews }))
    }

    // Update professional profile
    if (route.match(/^\/professionals\/[^/]+$/) && method === 'PUT') {
      const user = verifyToken(request)
      if (!user || user.role !== 'professional') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const professionalId = path[1]
      if (user.id !== professionalId) {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }

      const body = await request.json()
      const { fullName, phone, category, subcategory, bio, experience, location, serviceOptions, languages, socialLinks, profilePhoto } = body

      const updateData = {
        updatedAt: new Date()
      }

      if (fullName) updateData.fullName = fullName
      if (phone) updateData.phone = phone
      if (category) updateData.category = category
      if (subcategory !== undefined) updateData.subcategory = subcategory
      if (bio) updateData.bio = bio
      if (experience) updateData.experience = parseInt(experience)
      if (location) updateData.location = location
      if (serviceOptions) updateData.serviceOptions = serviceOptions
      if (languages) updateData.languages = languages
      if (socialLinks) updateData.socialLinks = socialLinks
      if (profilePhoto) updateData.profilePhoto = profilePhoto

      await db.collection('professionals').updateOne({ id: professionalId }, { $set: updateData })

      const updated = await db.collection('professionals').findOne({ id: professionalId })
      const { password: _, ...safeData } = updated
      return handleCORS(NextResponse.json({ message: 'Profile updated', professional: safeData }))
    }

    // Track contact click
    if (route.match(/^\/professionals\/[^/]+\/contact$/) && method === 'POST') {
      const professionalId = path[1]
      await db.collection('professionals').updateOne(
        { id: professionalId },
        { $inc: { 'analytics.contactClicks': 1 } }
      )
      return handleCORS(NextResponse.json({ message: 'Contact click tracked' }))
    }

    // ==================== SEARCH ROUTES ====================

    if (route === '/search' && method === 'GET') {
      const url = new URL(request.url)
      const category = url.searchParams.get('category')
      const country = url.searchParams.get('country')
      const city = url.searchParams.get('city')
      const keyword = url.searchParams.get('keyword')
      const serviceType = url.searchParams.get('serviceType') // virtual, inPerson
      const minExperience = parseInt(url.searchParams.get('minExperience')) || 0
      const minRating = parseFloat(url.searchParams.get('minRating')) || 0
      const page = parseInt(url.searchParams.get('page')) || 1
      const limit = parseInt(url.searchParams.get('limit')) || 12
      const sortBy = url.searchParams.get('sortBy') || 'relevance' // relevance, rating, experience

      const query = { 'verification.status': 'approved', isActive: true }

      if (category) query.category = category
      if (country) query['location.country'] = { $regex: country, $options: 'i' }
      if (city) query['location.city'] = { $regex: city, $options: 'i' }
      if (keyword) {
        query.$or = [
          { fullName: { $regex: keyword, $options: 'i' } },
          { bio: { $regex: keyword, $options: 'i' } },
          { subcategory: { $regex: keyword, $options: 'i' } }
        ]
      }
      if (serviceType === 'virtual') query['serviceOptions.virtual'] = true
      if (serviceType === 'inPerson') query['serviceOptions.inPerson'] = true
      if (minExperience > 0) query.experience = { $gte: minExperience }
      if (minRating > 0) query['ratings.average'] = { $gte: minRating }

      let sortOptions = { 'featured.isFeatured': -1 }
      if (sortBy === 'rating') sortOptions['ratings.average'] = -1
      else if (sortBy === 'experience') sortOptions.experience = -1
      else sortOptions['ratings.average'] = -1

      const total = await db.collection('professionals').countDocuments(query)
      const professionals = await db.collection('professionals')
        .find(query)
        .project({ password: 0 })
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray()

      return handleCORS(NextResponse.json({
        professionals,
        filters: { category, country, city, keyword, serviceType, minExperience, minRating },
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }))
    }

    // ==================== REVIEW ROUTES ====================

    // Add review
    if (route === '/reviews' && method === 'POST') {
      const body = await request.json()
      const { professionalId, clientName, clientEmail, rating, comment } = body

      if (!professionalId || !clientName || !clientEmail || !rating || !comment) {
        return handleCORS(NextResponse.json({ error: 'Missing required fields' }, { status: 400 }))
      }

      const professional = await db.collection('professionals').findOne({ id: professionalId })
      if (!professional) {
        return handleCORS(NextResponse.json({ error: 'Professional not found' }, { status: 404 }))
      }

      const review = {
        id: uuidv4(),
        professionalId,
        clientName,
        clientEmail: clientEmail.toLowerCase(),
        rating: Math.min(5, Math.max(1, parseInt(rating))),
        comment,
        isVerified: false,
        status: 'pending',
        createdAt: new Date()
      }

      await db.collection('reviews').insertOne(review)
      return handleCORS(NextResponse.json({ message: 'Review submitted for approval', review }))
    }

    // Get reviews for a professional
    if (route.match(/^\/reviews\/[^/]+$/) && method === 'GET') {
      const professionalId = path[1]
      const reviews = await db.collection('reviews')
        .find({ professionalId, status: 'approved' })
        .sort({ createdAt: -1 })
        .toArray()
      return handleCORS(NextResponse.json({ reviews }))
    }

    // ==================== ADMIN ROUTES ====================

    // Get pending approvals
    if (route === '/admin/pending' && method === 'GET') {
      const user = verifyToken(request)
      if (!user || user.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const pending = await db.collection('professionals')
        .find({ 'verification.status': 'pending' })
        .project({ password: 0 })
        .sort({ createdAt: -1 })
        .toArray()

      return handleCORS(NextResponse.json({ pending }))
    }

    // Approve professional
    if (route.match(/^\/admin\/approve\/[^/]+$/) && method === 'PUT') {
      const user = verifyToken(request)
      if (!user || user.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const professionalId = path[2]
      await db.collection('professionals').updateOne(
        { id: professionalId },
        {
          $set: {
            'verification.status': 'approved',
            'verification.verifiedAt': new Date(),
            'verification.verifiedBy': user.id,
            updatedAt: new Date()
          }
        }
      )

      return handleCORS(NextResponse.json({ message: 'Professional approved' }))
    }

    // Reject professional
    if (route.match(/^\/admin\/reject\/[^/]+$/) && method === 'PUT') {
      const user = verifyToken(request)
      if (!user || user.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const professionalId = path[2]
      const body = await request.json()
      const { reason } = body

      await db.collection('professionals').updateOne(
        { id: professionalId },
        {
          $set: {
            'verification.status': 'rejected',
            'verification.rejectionReason': reason || 'Does not meet requirements',
            updatedAt: new Date()
          }
        }
      )

      return handleCORS(NextResponse.json({ message: 'Professional rejected' }))
    }

    // Get all professionals (admin)
    if (route === '/admin/professionals' && method === 'GET') {
      const user = verifyToken(request)
      if (!user || user.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const url = new URL(request.url)
      const status = url.searchParams.get('status')
      const page = parseInt(url.searchParams.get('page')) || 1
      const limit = parseInt(url.searchParams.get('limit')) || 20

      const query = {}
      if (status) query['verification.status'] = status

      const total = await db.collection('professionals').countDocuments(query)
      const professionals = await db.collection('professionals')
        .find(query)
        .project({ password: 0 })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray()

      return handleCORS(NextResponse.json({
        professionals,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }))
    }

    // Admin stats
    if (route === '/admin/stats' && method === 'GET') {
      const user = verifyToken(request)
      if (!user || user.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const totalProfessionals = await db.collection('professionals').countDocuments()
      const pendingApprovals = await db.collection('professionals').countDocuments({ 'verification.status': 'pending' })
      const approvedProfessionals = await db.collection('professionals').countDocuments({ 'verification.status': 'approved' })
      const rejectedProfessionals = await db.collection('professionals').countDocuments({ 'verification.status': 'rejected' })
      const totalReviews = await db.collection('reviews').countDocuments()
      const pendingReviews = await db.collection('reviews').countDocuments({ status: 'pending' })

      // Category breakdown
      const categoryBreakdown = await db.collection('professionals').aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray()

      return handleCORS(NextResponse.json({
        stats: {
          totalProfessionals,
          pendingApprovals,
          approvedProfessionals,
          rejectedProfessionals,
          totalReviews,
          pendingReviews
        },
        categoryBreakdown
      }))
    }

    // Approve review (admin)
    if (route.match(/^\/admin\/reviews\/[^/]+\/approve$/) && method === 'PUT') {
      const user = verifyToken(request)
      if (!user || user.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const reviewId = path[2]
      const review = await db.collection('reviews').findOne({ id: reviewId })
      if (!review) {
        return handleCORS(NextResponse.json({ error: 'Review not found' }, { status: 404 }))
      }

      await db.collection('reviews').updateOne({ id: reviewId }, { $set: { status: 'approved' } })

      // Update professional's average rating
      const approvedReviews = await db.collection('reviews')
        .find({ professionalId: review.professionalId, status: 'approved' })
        .toArray()

      if (approvedReviews.length > 0) {
        const avgRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
        await db.collection('professionals').updateOne(
          { id: review.professionalId },
          { $set: { 'ratings.average': Math.round(avgRating * 10) / 10, 'ratings.count': approvedReviews.length } }
        )
      }

      return handleCORS(NextResponse.json({ message: 'Review approved' }))
    }

    // Get pending reviews (admin)
    if (route === '/admin/reviews/pending' && method === 'GET') {
      const user = verifyToken(request)
      if (!user || user.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const pendingReviews = await db.collection('reviews')
        .find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .toArray()

      return handleCORS(NextResponse.json({ reviews: pendingReviews }))
    }

    // ==================== CATEGORIES ROUTE ====================

    if (route === '/categories' && method === 'GET') {
      const categoryCounts = await db.collection('professionals').aggregate([
        { $match: { 'verification.status': 'approved', isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]).toArray()

      const categoryMap = {}
      categoryCounts.forEach(c => { categoryMap[c._id] = c.count })

      const categories = CATEGORIES.map(cat => ({
        name: cat,
        count: categoryMap[cat] || 0
      }))

      return handleCORS(NextResponse.json({ categories }))
    }

    // Route not found
    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 }))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute