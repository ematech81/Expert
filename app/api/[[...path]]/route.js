import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'
import sgMail from '@sendgrid/mail'

// MongoDB connection
let client
let db

const JWT_SECRET = process.env.JWT_SECRET || 'expertbridge-secret-key-2024'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Configure SendGrid
if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your_sendgrid_api_key') {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

// Subscription Plans
const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Subscription',
    amount: 1500000, // ₦15,000 in kobo
    currency: 'NGN',
    duration: 30, // days
    benefits: ['Featured Expert Carousel', 'Verified Badge', 'Social Media Promotions']
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly Subscription',
    amount: 4000000, // ₦40,000 in kobo
    currency: 'NGN',
    duration: 365, // days
    benefits: ['Featured Expert Carousel', 'Verified Badge', 'Social Media Promotions', 'Google Ads Inclusion']
  }
}

const CATEGORIES = [
  'Psychologist', 'Lawyer', 'Financial Advisor', 'Career Coach',
  'Business Consultant', 'Physiotherapist', 'Nutritionist',
  'Accountant', 'Architect', 'Marriage Counselor', 'Tax Consultant',
  'Real Estate Agent', 'IT Consultant', 'Marketing Consultant',
  'HR Consultant', 'Life Coach', 'Immigration Consultant',
  'Event Planner', 'Interior Designer', 'Education Consultant',
  'Web Developer', 'Graphics Designer', 'Teacher', 'Housing Agent', 'Caterer'
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

// Email sending helper function
async function sendEmail(to, subject, htmlContent) {
  if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key') {
    console.log('SendGrid not configured. Email would be sent to:', to, 'Subject:', subject)
    return { success: true, mocked: true }
  }

  try {
    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@expertbridge.com',
        name: process.env.SENDGRID_FROM_NAME || 'ExpertBridge'
      },
      subject,
      html: htmlContent
    }
    await sgMail.send(msg)
    return { success: true }
  } catch (error) {
    console.error('SendGrid Error:', error)
    return { success: false, error: error.message }
  }
}

// Email Templates
function getApprovalEmailTemplate(name) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Congratulations! You're Approved!</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>Great news! Your ExpertBridge profile has been <strong>approved</strong>.</p>
          <p>You are now visible to potential clients searching for professionals in your category. Here's what you can do next:</p>
          <ul>
            <li>Complete your profile with more details</li>
            <li>Add a professional photo</li>
            <li>Consider upgrading to Featured status for more visibility</li>
          </ul>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}" class="button">Visit Your Dashboard</a>
          <p>Thank you for joining ExpertBridge!</p>
        </div>
        <div class="footer">
          <p>© 2025 ExpertBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function getRejectionEmailTemplate(name, reason) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #64748b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .reason { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Profile Review Update</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>Thank you for your interest in joining ExpertBridge. After reviewing your application, we were unable to approve your profile at this time.</p>
          <div class="reason">
            <strong>Reason:</strong> ${reason || 'Does not meet verification requirements'}
          </div>
          <p>You may update your profile and resubmit for review. If you have questions, please contact our support team.</p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}" class="button">Update Your Profile</a>
        </div>
        <div class="footer">
          <p>© 2025 ExpertBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function getWelcomeEmailTemplate(name) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ExpertBridge!</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>Thank you for registering on ExpertBridge! Your profile has been submitted and is currently <strong>pending review</strong>.</p>
          <p>Our team will review your application within 24-48 hours. You'll receive an email notification once your profile is approved.</p>
          <p>In the meantime, you can:</p>
          <ul>
            <li>Log in to view your dashboard</li>
            <li>Add more details to your profile</li>
            <li>Upload verification documents</li>
          </ul>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}" class="button">Go to Dashboard</a>
        </div>
        <div class="footer">
          <p>© 2025 ExpertBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function getSubscriptionEmailTemplate(name, plan, expiryDate) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .benefits { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Subscription Activated!</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>Your <strong>${plan.name}</strong> subscription has been activated successfully!</p>
          <div class="benefits">
            <h3>Your Benefits:</h3>
            <ul>
              ${plan.benefits.map(b => `<li>${b}</li>`).join('')}
            </ul>
          </div>
          <p><strong>Subscription Valid Until:</strong> ${new Date(expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}" class="button">View Your Profile</a>
        </div>
        <div class="footer">
          <p>© 2025 ExpertBridge. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
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
        subscription: {
          plan: null,
          status: 'inactive',
          startDate: null,
          endDate: null,
          paystackRef: null
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

      // Send welcome email
      await sendEmail(
        professional.email,
        'Welcome to ExpertBridge!',
        getWelcomeEmailTemplate(professional.fullName)
      )

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

    // Get featured professionals only
    if (route === '/professionals/featured' && method === 'GET') {
      const url = new URL(request.url)
      const limit = parseInt(url.searchParams.get('limit')) || 6

      const professionals = await db.collection('professionals')
        .find({
          'verification.status': 'approved',
          isActive: true,
          'featured.isFeatured': true,
          'featured.featuredUntil': { $gt: new Date() }
        })
        .project({ password: 0 })
        .sort({ 'ratings.average': -1, createdAt: -1 })
        .limit(limit)
        .toArray()

      return handleCORS(NextResponse.json({ professionals }))
    }

    // Get single professional (public)
    if (route.match(/^\/professionals\/[^/]+$/) && !route.includes('featured') && method === 'GET') {
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

    // ==================== UPLOAD ROUTES ====================

    // Upload profile photo
    if (route === '/upload/profile-photo' && method === 'POST') {
      const user = verifyToken(request)
      if (!user || user.role !== 'professional') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const body = await request.json()
      const { imageData } = body // Base64 encoded image

      if (!imageData) {
        return handleCORS(NextResponse.json({ error: 'No image data provided' }, { status: 400 }))
      }

      // Check if Cloudinary is configured
      if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
        // Return a mock response if Cloudinary is not configured
        return handleCORS(NextResponse.json({ 
          message: 'Cloudinary not configured. Image upload simulated.',
          url: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=3b82f6&color=fff&size=200`,
          publicId: null,
          mocked: true
        }))
      }

      try {
        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(imageData, {
          folder: 'expertbridge/profiles',
          public_id: `profile_${user.id}`,
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' }
          ]
        })

        // Update professional's profile photo
        await db.collection('professionals').updateOne(
          { id: user.id },
          {
            $set: {
              profilePhoto: {
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id
              },
              updatedAt: new Date()
            }
          }
        )

        return handleCORS(NextResponse.json({
          message: 'Profile photo updated',
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id
        }))
      } catch (error) {
        console.error('Cloudinary upload error:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to upload image' }, { status: 500 }))
      }
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

      const reviewRating = Math.min(5, Math.max(1, parseInt(rating)))
      
      const review = {
        id: uuidv4(),
        professionalId,
        clientName,
        clientEmail: clientEmail.toLowerCase(),
        rating: reviewRating,
        comment,
        isVerified: false,
        status: 'approved', // Auto-approve reviews - no admin approval needed
        createdAt: new Date()
      }

      await db.collection('reviews').insertOne(review)

      // Update professional's average rating immediately
      const allApprovedReviews = await db.collection('reviews')
        .find({ professionalId, status: 'approved' })
        .toArray()

      if (allApprovedReviews.length > 0) {
        const avgRating = allApprovedReviews.reduce((sum, r) => sum + r.rating, 0) / allApprovedReviews.length
        await db.collection('professionals').updateOne(
          { id: professionalId },
          { $set: { 'ratings.average': Math.round(avgRating * 10) / 10, 'ratings.count': allApprovedReviews.length } }
        )
      }

      return handleCORS(NextResponse.json({ message: 'Review submitted successfully', review }))
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

    // ==================== SUBSCRIPTION ROUTES ====================

    // Get subscription plans
    if (route === '/subscriptions/plans' && method === 'GET') {
      return handleCORS(NextResponse.json({ plans: SUBSCRIPTION_PLANS }))
    }

    // Initialize Paystack payment
    if (route === '/subscriptions/initialize' && method === 'POST') {
      const user = verifyToken(request)
      if (!user || user.role !== 'professional') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const body = await request.json()
      const { planId } = body

      const plan = SUBSCRIPTION_PLANS[planId]
      if (!plan) {
        return handleCORS(NextResponse.json({ error: 'Invalid plan' }, { status: 400 }))
      }

      const professional = await db.collection('professionals').findOne({ id: user.id })
      if (!professional) {
        return handleCORS(NextResponse.json({ error: 'Professional not found' }, { status: 404 }))
      }

      // Check if Paystack is configured
      if (!process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY === 'your_paystack_secret_key') {
        // Return mock response for testing
        const mockRef = `mock_${uuidv4()}`
        return handleCORS(NextResponse.json({
          message: 'Paystack not configured. Payment simulated.',
          authorization_url: `${process.env.NEXT_PUBLIC_BASE_URL}?payment=mock&ref=${mockRef}`,
          reference: mockRef,
          mocked: true
        }))
      }

      // Initialize Paystack transaction
      try {
        const reference = `sub_${uuidv4()}`
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: professional.email,
            amount: plan.amount,
            reference,
            callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/subscriptions/verify?reference=${reference}`,
            metadata: {
              professional_id: user.id,
              plan_id: planId,
              plan_name: plan.name
            }
          })
        })

        const data = await response.json()

        if (!data.status) {
          return handleCORS(NextResponse.json({ error: data.message || 'Payment initialization failed' }, { status: 400 }))
        }

        // Store pending subscription
        await db.collection('subscriptions').insertOne({
          id: uuidv4(),
          professionalId: user.id,
          planId,
          reference,
          amount: plan.amount,
          status: 'pending',
          createdAt: new Date()
        })

        return handleCORS(NextResponse.json({
          authorization_url: data.data.authorization_url,
          reference: data.data.reference
        }))
      } catch (error) {
        console.error('Paystack error:', error)
        return handleCORS(NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 }))
      }
    }

    // Verify Paystack payment
    if (route === '/subscriptions/verify' && method === 'GET') {
      const url = new URL(request.url)
      const reference = url.searchParams.get('reference')

      if (!reference) {
        return handleCORS(NextResponse.json({ error: 'Reference required' }, { status: 400 }))
      }

      // Check for mock payment
      if (reference.startsWith('mock_')) {
        return handleCORS(NextResponse.json({
          message: 'Mock payment verified',
          mocked: true
        }))
      }

      // Check if Paystack is configured
      if (!process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY === 'your_paystack_secret_key') {
        return handleCORS(NextResponse.json({ error: 'Paystack not configured' }, { status: 400 }))
      }

      try {
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: {
            'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
          }
        })

        const data = await response.json()

        if (!data.status || data.data.status !== 'success') {
          return handleCORS(NextResponse.json({ error: 'Payment verification failed' }, { status: 400 }))
        }

        const { professional_id, plan_id } = data.data.metadata
        const plan = SUBSCRIPTION_PLANS[plan_id]

        if (!plan) {
          return handleCORS(NextResponse.json({ error: 'Invalid plan' }, { status: 400 }))
        }

        const startDate = new Date()
        const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000)

        // Update professional's subscription and featured status
        await db.collection('professionals').updateOne(
          { id: professional_id },
          {
            $set: {
              'subscription.plan': plan_id,
              'subscription.status': 'active',
              'subscription.startDate': startDate,
              'subscription.endDate': endDate,
              'subscription.paystackRef': reference,
              'featured.isFeatured': true,
              'featured.featuredUntil': endDate,
              'featured.featuredTier': plan_id,
              updatedAt: new Date()
            }
          }
        )

        // Update subscription record
        await db.collection('subscriptions').updateOne(
          { reference },
          {
            $set: {
              status: 'completed',
              completedAt: new Date()
            }
          }
        )

        // Get professional for email
        const professional = await db.collection('professionals').findOne({ id: professional_id })
        if (professional) {
          await sendEmail(
            professional.email,
            'Subscription Activated - ExpertBridge',
            getSubscriptionEmailTemplate(professional.fullName, plan, endDate)
          )
        }

        return handleCORS(NextResponse.json({
          message: 'Subscription activated',
          subscription: {
            plan: plan_id,
            startDate,
            endDate
          }
        }))
      } catch (error) {
        console.error('Payment verification error:', error)
        return handleCORS(NextResponse.json({ error: 'Payment verification failed' }, { status: 500 }))
      }
    }

    // Activate subscription (for mock/testing)
    if (route === '/subscriptions/activate' && method === 'POST') {
      const user = verifyToken(request)
      if (!user || user.role !== 'professional') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const body = await request.json()
      const { planId, reference } = body

      const plan = SUBSCRIPTION_PLANS[planId]
      if (!plan) {
        return handleCORS(NextResponse.json({ error: 'Invalid plan' }, { status: 400 }))
      }

      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000)

      // Update professional's subscription and featured status
      await db.collection('professionals').updateOne(
        { id: user.id },
        {
          $set: {
            'subscription.plan': planId,
            'subscription.status': 'active',
            'subscription.startDate': startDate,
            'subscription.endDate': endDate,
            'subscription.paystackRef': reference || 'manual',
            'featured.isFeatured': true,
            'featured.featuredUntil': endDate,
            'featured.featuredTier': planId,
            updatedAt: new Date()
          }
        }
      )

      // Get updated professional
      const professional = await db.collection('professionals').findOne({ id: user.id })
      
      // Send confirmation email
      await sendEmail(
        professional.email,
        'Subscription Activated - ExpertBridge',
        getSubscriptionEmailTemplate(professional.fullName, plan, endDate)
      )

      const { password: _, ...safeData } = professional
      return handleCORS(NextResponse.json({
        message: 'Subscription activated',
        professional: safeData
      }))
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
      const professional = await db.collection('professionals').findOne({ id: professionalId })
      
      if (!professional) {
        return handleCORS(NextResponse.json({ error: 'Professional not found' }, { status: 404 }))
      }

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

      // Send approval email
      await sendEmail(
        professional.email,
        'Your ExpertBridge Profile is Approved!',
        getApprovalEmailTemplate(professional.fullName)
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
      const professional = await db.collection('professionals').findOne({ id: professionalId })
      
      if (!professional) {
        return handleCORS(NextResponse.json({ error: 'Professional not found' }, { status: 404 }))
      }

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

      // Send rejection email
      await sendEmail(
        professional.email,
        'ExpertBridge Profile Review Update',
        getRejectionEmailTemplate(professional.fullName, reason)
      )

      return handleCORS(NextResponse.json({ message: 'Professional rejected' }))
    }

    // Delete professional (admin)
    if (route.match(/^\/admin\/professionals\/[^/]+$/) && method === 'DELETE') {
      const user = verifyToken(request)
      if (!user || user.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const professionalId = path[2]
      
      // Check if professional exists
      const professional = await db.collection('professionals').findOne({ id: professionalId })
      if (!professional) {
        return handleCORS(NextResponse.json({ error: 'Professional not found' }, { status: 404 }))
      }

      // Delete professional
      await db.collection('professionals').deleteOne({ id: professionalId })
      
      // Also delete their reviews
      await db.collection('reviews').deleteMany({ professionalId })
      
      // Delete their subscriptions
      await db.collection('subscriptions').deleteMany({ professionalId })

      return handleCORS(NextResponse.json({ message: 'Professional deleted successfully' }))
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
      const featuredProfessionals = await db.collection('professionals').countDocuments({ 
        'featured.isFeatured': true, 
        'featured.featuredUntil': { $gt: new Date() } 
      })
      const totalReviews = await db.collection('reviews').countDocuments()
      const pendingReviews = await db.collection('reviews').countDocuments({ status: 'pending' })
      const totalSubscriptions = await db.collection('subscriptions').countDocuments({ status: 'completed' })

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
          featuredProfessionals,
          totalReviews,
          pendingReviews,
          totalSubscriptions
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
