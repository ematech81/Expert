'use client'

import { useState, useEffect, useCallback, memo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { 
  Search, MapPin, Star, Phone, Mail, Globe, Linkedin, Twitter,
  Users, Award, CheckCircle, Clock, Filter, ChevronRight, Menu, X, LogOut,
  Building, Briefcase, Heart, Shield, TrendingUp, Eye, MousePointer,
  User, Settings, BarChart3, FileCheck, XCircle, Loader2, Edit, BadgeCheck,
  Camera, Upload, CreditCard, Trash2, Crown
} from 'lucide-react'

const CATEGORIES = [
  { name: 'Psychologist', icon: Heart, color: 'bg-pink-500' },
  { name: 'Lawyer', icon: Briefcase, color: 'bg-slate-700' },
  { name: 'Financial Advisor', icon: TrendingUp, color: 'bg-emerald-500' },
  { name: 'Career Coach', icon: Award, color: 'bg-amber-500' },
  { name: 'Business Consultant', icon: Building, color: 'bg-blue-600' },
  { name: 'Physiotherapist', icon: Heart, color: 'bg-red-500' },
  { name: 'Nutritionist', icon: Heart, color: 'bg-green-500' },
  { name: 'Accountant', icon: BarChart3, color: 'bg-indigo-500' },
  { name: 'Architect', icon: Building, color: 'bg-orange-500' },
  { name: 'Marriage Counselor', icon: Heart, color: 'bg-rose-500' },
  { name: 'Tax Consultant', icon: FileCheck, color: 'bg-teal-500' },
  { name: 'Real Estate Agent', icon: Building, color: 'bg-cyan-500' },
  { name: 'IT Consultant', icon: Settings, color: 'bg-purple-500' },
  { name: 'Marketing Consultant', icon: TrendingUp, color: 'bg-fuchsia-500' },
  { name: 'HR Consultant', icon: Users, color: 'bg-sky-500' },
  { name: 'Life Coach', icon: Award, color: 'bg-yellow-500' },
  { name: 'Immigration Consultant', icon: Globe, color: 'bg-blue-500' },
  { name: 'Event Planner', icon: Award, color: 'bg-violet-500' },
  { name: 'Interior Designer', icon: Building, color: 'bg-lime-500' },
  { name: 'Education Consultant', icon: Award, color: 'bg-emerald-600' }
]

const HERO_IMAGE = 'https://images.pexels.com/photos/7616608/pexels-photo-7616608.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
const HERO_BG_IMAGE = 'https://customer-assets.emergentagent.com/job_expertfinder-22/artifacts/dqjfwgeo_heroSection-2.svg'

// Subscription Plans
const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Subscription',
    amount: 15000,
    displayAmount: '₦15,000',
    duration: '1 Month',
    benefits: ['Featured Expert Carousel', 'Verified Badge', 'Social Media Promotions']
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly Subscription',
    amount: 40000,
    displayAmount: '₦40,000',
    duration: '1 Year',
    benefits: ['Featured Expert Carousel', 'Verified Badge', 'Social Media Promotions', 'Google Ads Inclusion'],
    savings: 'Save ₦140,000/year'
  }
}

// Helper function to get the appropriate badge for a professional
function getProfessionalBadge(professional) {
  // Verified badge only for featured/paid professionals
  if (professional.featured?.isFeatured && professional.featured?.featuredUntil && new Date(professional.featured.featuredUntil) > new Date()) {
    return { label: 'Verified', variant: 'default', className: 'bg-blue-500', icon: BadgeCheck }
  }
  // Approved badge for approved but not featured professionals
  if (professional.verification?.status === 'approved') {
    return { label: 'Approved', variant: 'secondary', className: 'bg-green-500 text-white', icon: CheckCircle }
  }
  return null
}

// Professional Card Component
const ProfessionalCard = memo(function ProfessionalCard({ professional, onClick }) {
  const badge = getProfessionalBadge(professional)
  
  return (
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/10">
            <AvatarImage src={professional.profilePhoto?.url} alt={professional.fullName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {professional.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg truncate">{professional.fullName}</CardTitle>
              {badge && (
                <Badge className={badge.className}>
                  <badge.icon className="h-3 w-3 mr-1" />
                  {badge.label}
                </Badge>
              )}
            </div>
            <CardDescription className="flex items-center gap-1">
              <Badge variant="secondary" className="font-normal">{professional.category}</Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{professional.bio}</p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {professional.location?.city}, {professional.location?.country}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            {professional.experience} years
          </span>
          {professional.ratings?.count > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {professional.ratings.average} ({professional.ratings.count})
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex gap-2">
          {professional.serviceOptions?.virtual && <Badge variant="outline" className="text-xs">Virtual</Badge>}
          {professional.serviceOptions?.inPerson && <Badge variant="outline" className="text-xs">In-Person</Badge>}
        </div>
      </CardFooter>
    </Card>
  )
})

// Login Dialog Component
function LoginDialog({ open, onOpenChange, onLogin, isLoading }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = () => {
    onLogin(email, password)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Professional Login</DialogTitle>
          <DialogDescription>Sign in to your ExpertBridge account</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input 
              id="login-email" 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input 
              id="login-password" 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Admin Login Dialog Component
function AdminLoginDialog({ open, onOpenChange, onLogin, isLoading }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = () => {
    onLogin(email, password)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Admin Login</DialogTitle>
          <DialogDescription>Sign in to the admin dashboard</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input 
              id="admin-email" 
              type="email" 
              placeholder="admin@expertbridge.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input 
              id="admin-password" 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Registration Dialog Component
function RegisterDialog({ open, onOpenChange, onRegister, isLoading }) {
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
    category: '', subcategory: '', bio: '', experience: '',
    country: '', state: '', city: '',
    inPerson: false, virtual: true, serviceRadius: 'city',
    languages: 'English', linkedin: '', twitter: '', website: ''
  })

  const handleSubmit = () => {
    onRegister(form)
  }

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Join ExpertBridge</DialogTitle>
          <DialogDescription>Create your professional profile and connect with clients globally</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Full Name *</Label>
              <Input id="reg-name" placeholder="John Doe" value={form.fullName} onChange={(e) => updateForm('fullName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email *</Label>
              <Input id="reg-email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => updateForm('email', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reg-phone">Phone</Label>
              <Input id="reg-phone" placeholder="+1234567890" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-category">Category *</Label>
              <Select value={form.category} onValueChange={(value) => updateForm('category', value)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reg-subcategory">Specialization</Label>
              <Input id="reg-subcategory" placeholder="e.g., Corporate Lawyer" value={form.subcategory} onChange={(e) => updateForm('subcategory', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-experience">Years of Experience *</Label>
              <Input id="reg-experience" type="number" min="0" placeholder="5" value={form.experience} onChange={(e) => updateForm('experience', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-bio">Professional Bio * (min 100 chars)</Label>
            <Textarea id="reg-bio" placeholder="Describe your expertise, qualifications, and what makes you unique..." className="min-h-[100px]" value={form.bio} onChange={(e) => updateForm('bio', e.target.value)} />
            <p className="text-xs text-muted-foreground">{form.bio.length}/100 characters minimum</p>
          </div>
          <Separator />
          <h4 className="font-medium">Location</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reg-country">Country *</Label>
              <Input id="reg-country" placeholder="Nigeria" value={form.country} onChange={(e) => updateForm('country', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-state">State/Region *</Label>
              <Input id="reg-state" placeholder="Lagos" value={form.state} onChange={(e) => updateForm('state', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-city">City *</Label>
              <Input id="reg-city" placeholder="Lagos" value={form.city} onChange={(e) => updateForm('city', e.target.value)} />
            </div>
          </div>
          <Separator />
          <h4 className="font-medium">Service Options</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="reg-virtual" checked={form.virtual} onCheckedChange={(checked) => updateForm('virtual', checked)} />
              <Label htmlFor="reg-virtual">Virtual consultations</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="reg-inperson" checked={form.inPerson} onCheckedChange={(checked) => updateForm('inPerson', checked)} />
              <Label htmlFor="reg-inperson">In-person meetings</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-languages">Languages (comma-separated)</Label>
            <Input id="reg-languages" placeholder="English, French, Yoruba" value={form.languages} onChange={(e) => updateForm('languages', e.target.value)} />
          </div>
          <Separator />
          <h4 className="font-medium">Password</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password *</Label>
              <Input id="reg-password" type="password" placeholder="••••••••" value={form.password} onChange={(e) => updateForm('password', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-confirm">Confirm Password *</Label>
              <Input id="reg-confirm" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={(e) => updateForm('confirmPassword', e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Profile Photo Upload Component
function ProfilePhotoUpload({ currentPhoto, onUpload, isLoading }) {
  const fileInputRef = useRef(null)
  const [preview, setPreview] = useState(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
    }
    reader.readAsDataURL(file)

    // Convert to base64 for upload
    const base64Reader = new FileReader()
    base64Reader.onload = async (e) => {
      await onUpload(e.target.result)
    }
    base64Reader.readAsDataURL(file)
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24 border-4 border-primary/10">
          <AvatarImage src={preview || currentPhoto} />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            <User className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <div>
        <p className="font-medium">Profile Photo</p>
        <p className="text-sm text-muted-foreground">Click the camera icon to upload</p>
        <p className="text-xs text-muted-foreground">Max size: 5MB</p>
      </div>
    </div>
  )
}

// Edit Profile Dialog Component
function EditProfileDialog({ open, onOpenChange, user, onSave, onPhotoUpload, isLoading }) {
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    subcategory: user?.subcategory || '',
    bio: user?.bio || '',
    experience: user?.experience?.toString() || '',
    country: user?.location?.country || '',
    state: user?.location?.state || '',
    city: user?.location?.city || '',
    inPerson: user?.serviceOptions?.inPerson || false,
    virtual: user?.serviceOptions?.virtual || true,
    languages: user?.languages?.join(', ') || 'English',
    linkedin: user?.socialLinks?.linkedin || '',
    twitter: user?.socialLinks?.twitter || '',
    website: user?.socialLinks?.website || ''
  })
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        subcategory: user.subcategory || '',
        bio: user.bio || '',
        experience: user.experience?.toString() || '',
        country: user.location?.country || '',
        state: user.location?.state || '',
        city: user.location?.city || '',
        inPerson: user.serviceOptions?.inPerson || false,
        virtual: user.serviceOptions?.virtual || true,
        languages: user.languages?.join(', ') || 'English',
        linkedin: user.socialLinks?.linkedin || '',
        twitter: user.socialLinks?.twitter || '',
        website: user.socialLinks?.website || ''
      })
    }
  }, [user])

  const handleSubmit = () => {
    onSave(form)
  }

  const handlePhotoUpload = async (imageData) => {
    setIsUploading(true)
    await onPhotoUpload(imageData)
    setIsUploading(false)
  }

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your professional information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Profile Photo Upload */}
          <ProfilePhotoUpload 
            currentPhoto={user?.profilePhoto?.url} 
            onUpload={handlePhotoUpload}
            isLoading={isUploading}
          />
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input id="edit-name" value={form.fullName} onChange={(e) => updateForm('fullName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-subcategory">Specialization</Label>
              <Input id="edit-subcategory" value={form.subcategory} onChange={(e) => updateForm('subcategory', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-experience">Years of Experience</Label>
              <Input id="edit-experience" type="number" min="0" value={form.experience} onChange={(e) => updateForm('experience', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-bio">Professional Bio</Label>
            <Textarea id="edit-bio" className="min-h-[100px]" value={form.bio} onChange={(e) => updateForm('bio', e.target.value)} />
          </div>
          <Separator />
          <h4 className="font-medium">Location</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-country">Country</Label>
              <Input id="edit-country" value={form.country} onChange={(e) => updateForm('country', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-state">State/Region</Label>
              <Input id="edit-state" value={form.state} onChange={(e) => updateForm('state', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-city">City</Label>
              <Input id="edit-city" value={form.city} onChange={(e) => updateForm('city', e.target.value)} />
            </div>
          </div>
          <Separator />
          <h4 className="font-medium">Service Options</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="edit-virtual" checked={form.virtual} onCheckedChange={(checked) => updateForm('virtual', checked)} />
              <Label htmlFor="edit-virtual">Virtual consultations</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="edit-inperson" checked={form.inPerson} onCheckedChange={(checked) => updateForm('inPerson', checked)} />
              <Label htmlFor="edit-inperson">In-person meetings</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-languages">Languages (comma-separated)</Label>
            <Input id="edit-languages" value={form.languages} onChange={(e) => updateForm('languages', e.target.value)} />
          </div>
          <Separator />
          <h4 className="font-medium">Social Links</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-linkedin">LinkedIn URL</Label>
              <Input id="edit-linkedin" value={form.linkedin} onChange={(e) => updateForm('linkedin', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-twitter">Twitter URL</Label>
              <Input id="edit-twitter" value={form.twitter} onChange={(e) => updateForm('twitter', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-website">Website URL</Label>
              <Input id="edit-website" value={form.website} onChange={(e) => updateForm('website', e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Subscription Dialog Component
function SubscriptionDialog({ open, onOpenChange, onSubscribe, isLoading, currentSubscription }) {
  const [selectedPlan, setSelectedPlan] = useState('monthly')

  const handleSubscribe = () => {
    onSubscribe(selectedPlan)
  }

  const isActive = currentSubscription?.status === 'active' && new Date(currentSubscription?.endDate) > new Date()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            {isActive ? 'Subscription Status' : 'Upgrade to Featured Expert'}
          </DialogTitle>
          <DialogDescription>
            {isActive 
              ? 'Your current subscription details'
              : 'Get more visibility and attract more clients'
            }
          </DialogDescription>
        </DialogHeader>

        {isActive ? (
          <div className="py-4">
            <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-amber-100 rounded-full">
                    <Crown className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{SUBSCRIPTION_PLANS[currentSubscription.plan]?.name || 'Active Subscription'}</h3>
                    <p className="text-sm text-muted-foreground">Valid until {new Date(currentSubscription.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Your Benefits:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {SUBSCRIPTION_PLANS[currentSubscription.plan]?.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                <Card 
                  key={plan.id}
                  className={`cursor-pointer transition-all ${selectedPlan === plan.id ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h3 className="font-semibold">{plan.duration}</h3>
                      <p className="text-2xl font-bold text-primary mt-2">{plan.displayAmount}</p>
                      {plan.savings && (
                        <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700">
                          {plan.savings}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-3">Subscription Benefits:</h4>
              <ul className="space-y-2">
                {SUBSCRIPTION_PLANS[selectedPlan].benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          {!isActive && (
            <Button onClick={handleSubscribe} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
              Subscribe Now
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Delete Confirmation Dialog
function DeleteConfirmDialog({ open, onOpenChange, professional, onConfirm, isLoading }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Professional</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{professional?.fullName}</strong>? 
            This action cannot be undone. All data including reviews and subscriptions will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => onConfirm(professional?.id)}
            className="bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hero Search Component
function HeroSearch({ onSearch }) {
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')

  const handleSearch = () => {
    onSearch(category, location)
  }

  return (
    <Card className="p-2 bg-white/95 backdrop-blur">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex-1">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="border-0 bg-transparent">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Input 
            placeholder="Location (city or country)" 
            className="border-0 bg-transparent"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <Button size="lg" onClick={handleSearch} className="px-8">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>
    </Card>
  )
}

// Search Filters Component
function SearchFilters({ onSearch, initialCategory, initialLocation, initialKeyword }) {
  const [category, setCategory] = useState(initialCategory || '')
  const [location, setLocation] = useState(initialLocation || '')
  const [keyword, setKeyword] = useState(initialKeyword || '')

  const handleApply = () => {
    onSearch(category, location, keyword)
  }

  const handleClear = () => {
    setCategory('')
    setLocation('')
    setKeyword('')
    onSearch('', '', '')
  }

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          <Input 
            placeholder="City or country" 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Keyword</Label>
          <Input 
            placeholder="Search by name or skill" 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <Button className="w-full" onClick={handleApply}>
          Apply Filters
        </Button>
        <Button variant="outline" className="w-full" onClick={handleClear}>
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  )
}

// Admin Pending Card Component
function AdminPendingCard({ professional, onApprove, onReject }) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const handleApprove = async () => {
    setIsApproving(true)
    await onApprove(professional.id)
    setIsApproving(false)
  }

  const handleReject = async () => {
    setIsRejecting(true)
    await onReject(professional.id, 'Does not meet verification requirements')
    setIsRejecting(false)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={professional.profilePhoto?.url} />
              <AvatarFallback>{professional.fullName?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{professional.fullName}</h3>
              <p className="text-muted-foreground">{professional.category} • {professional.experience} years</p>
              <p className="text-sm text-muted-foreground">{professional.location?.city}, {professional.location?.country}</p>
              <p className="text-sm text-muted-foreground">{professional.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleApprove} disabled={isApproving}>
              {isApproving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={handleReject} disabled={isRejecting}>
              {isRejecting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
              Reject
            </Button>
          </div>
        </div>
        <Separator className="my-4" />
        <p className="text-sm line-clamp-3">{professional.bio}</p>
      </CardContent>
    </Card>
  )
}

// Review Form Component - Only for visitors, not for the profile owner
function ReviewForm({ professionalId, onSubmit, isVisible }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  if (!isVisible) return null

  const handleSubmit = async () => {
    if (!name || !email || !comment) {
      toast.error('Please fill in all fields')
      return
    }
    setIsSubmitting(true)
    const success = await onSubmit({ clientName: name, clientEmail: email, rating, comment, professionalId })
    if (success) {
      setName('')
      setEmail('')
      setRating(5)
      setComment('')
      setShowForm(false)
    }
    setIsSubmitting(false)
  }

  return (
    <div className="mb-6">
      {!showForm ? (
        <Button size="sm" onClick={() => setShowForm(true)}>
          Write a Review
        </Button>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Write a Review</h4>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Your Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Your Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)}>
                    <Star className={`h-6 w-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Your Review</Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." />
            </div>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Review
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Reviews Section Component with View More functionality
function ReviewsSection({ reviews, professionalId, currentUserId, onSubmitReview }) {
  const [showAll, setShowAll] = useState(false)
  const INITIAL_REVIEWS_COUNT = 2
  
  const isOwnProfile = currentUserId === professionalId
  const displayedReviews = showAll ? reviews : reviews.slice(0, INITIAL_REVIEWS_COUNT)
  const hasMoreReviews = reviews.length > INITIAL_REVIEWS_COUNT

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Reviews ({reviews.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Review form - only visible if not viewing own profile */}
        <ReviewForm 
          professionalId={professionalId} 
          onSubmit={onSubmitReview}
          isVisible={!isOwnProfile}
        />

        {reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No reviews yet. Be the first to review!</p>
        ) : (
          <>
            <div className="space-y-4">
              {displayedReviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{review.clientName}</p>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
            
            {/* View More button */}
            {hasMoreReviews && !showAll && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => setShowAll(true)}>
                  View More Reviews ({reviews.length - INITIAL_REVIEWS_COUNT} more)
                </Button>
              </div>
            )}
            
            {/* Show Less button */}
            {showAll && hasMoreReviews && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => setShowAll(false)}>
                  Show Less
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function App() {
  const [currentView, setCurrentView] = useState('home')
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [token, setToken] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [selectedProfessional, setSelectedProfessional] = useState(null)
  const [categories, setCategories] = useState([])
  const [featuredProfessionals, setFeaturedProfessionals] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 })
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentSearchParams, setCurrentSearchParams] = useState({ category: '', location: '', keyword: '' })

  // Dialog states
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)
  const [isAdminLoginDialogOpen, setIsAdminLoginDialogOpen] = useState(false)
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false)
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [professionalToDelete, setProfessionalToDelete] = useState(null)

  // Admin state
  const [adminStats, setAdminStats] = useState(null)
  const [pendingProfessionals, setPendingProfessionals] = useState([])
  const [allProfessionals, setAllProfessionals] = useState([])

  useEffect(() => {
    if (isInitialized) return
    
    const storedToken = localStorage.getItem('expertbridge_token')
    const storedUser = localStorage.getItem('expertbridge_user')
    const storedRole = localStorage.getItem('expertbridge_role')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      setUserRole(storedRole)
    }
    
    fetchCategories()
    fetchFeaturedProfessionals()
    setIsInitialized(true)
  }, [isInitialized])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (data.categories) setCategories(data.categories)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchFeaturedProfessionals = async () => {
    try {
      // First try to get featured (subscribed) professionals
      const featuredRes = await fetch('/api/professionals/featured?limit=6')
      const featuredData = await featuredRes.json()
      
      if (featuredData.professionals && featuredData.professionals.length > 0) {
        setFeaturedProfessionals(featuredData.professionals)
      } else {
        // Fallback to approved professionals if no featured ones
        const res = await fetch('/api/professionals?limit=6')
        const data = await res.json()
        if (data.professionals) setFeaturedProfessionals(data.professionals)
      }
    } catch (error) {
      console.error('Error fetching featured professionals:', error)
    }
  }

  // Refresh data function - to be called after approvals
  const refreshData = useCallback(() => {
    fetchCategories()
    fetchFeaturedProfessionals()
  }, [])

  const handleSearch = useCallback(async (category = '', location = '', keyword = '', page = 1) => {
    setIsLoading(true)
    setCurrentSearchParams({ category, location, keyword })
    try {
      const queryParams = new URLSearchParams()
      if (category && category !== 'all') queryParams.append('category', category)
      if (keyword) queryParams.append('keyword', keyword)
      if (location) queryParams.append('country', location)
      queryParams.append('page', page.toString())
      queryParams.append('limit', '12')

      const res = await fetch(`/api/search?${queryParams.toString()}`)
      const data = await res.json()
      setSearchResults(data.professionals || [])
      setPagination(data.pagination || { page: 1, total: 0, pages: 0 })
      setCurrentView('search')
    } catch (error) {
      toast.error('Search failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleCategoryClick = useCallback((categoryName) => {
    handleSearch(categoryName, '', '')
  }, [handleSearch])

  const handleLogin = async (email, password) => {
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok) {
        setToken(data.token)
        setUser(data.professional)
        setUserRole('professional')
        localStorage.setItem('expertbridge_token', data.token)
        localStorage.setItem('expertbridge_user', JSON.stringify(data.professional))
        localStorage.setItem('expertbridge_role', 'professional')
        setIsLoginDialogOpen(false)
        toast.success('Login successful!')
        setCurrentView('dashboard')
      } else {
        toast.error(data.error || 'Login failed')
      }
    } catch (error) {
      toast.error('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = async (email, password) => {
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok) {
        setToken(data.token)
        setUser(data.admin)
        setUserRole('admin')
        localStorage.setItem('expertbridge_token', data.token)
        localStorage.setItem('expertbridge_user', JSON.stringify(data.admin))
        localStorage.setItem('expertbridge_role', 'admin')
        setIsAdminLoginDialogOpen(false)
        toast.success('Admin login successful!')
        setCurrentView('admin')
        fetchAdminData(data.token)
      } else {
        toast.error(data.error || 'Login failed')
      }
    } catch (error) {
      toast.error('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (regForm) => {
    if (regForm.password !== regForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (!regForm.fullName || !regForm.email || !regForm.password || !regForm.category || !regForm.bio || !regForm.experience) {
      toast.error('Please fill in all required fields')
      return
    }
    if (regForm.bio.length < 100) {
      toast.error('Bio must be at least 100 characters')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regForm.fullName,
          email: regForm.email,
          phone: regForm.phone,
          password: regForm.password,
          category: regForm.category,
          subcategory: regForm.subcategory,
          bio: regForm.bio,
          experience: regForm.experience,
          location: {
            country: regForm.country,
            state: regForm.state,
            city: regForm.city
          },
          serviceOptions: {
            inPerson: regForm.inPerson,
            virtual: regForm.virtual,
            serviceRadius: regForm.serviceRadius
          },
          languages: regForm.languages.split(',').map(l => l.trim()),
          socialLinks: {
            linkedin: regForm.linkedin,
            twitter: regForm.twitter,
            website: regForm.website
          }
        })
      })
      const data = await res.json()
      if (res.ok) {
        setToken(data.token)
        setUser(data.professional)
        setUserRole('professional')
        localStorage.setItem('expertbridge_token', data.token)
        localStorage.setItem('expertbridge_user', JSON.stringify(data.professional))
        localStorage.setItem('expertbridge_role', 'professional')
        setIsRegisterDialogOpen(false)
        toast.success('Registration successful! Your profile is pending approval.')
        setCurrentView('dashboard')
      } else {
        toast.error(data.error || 'Registration failed')
      }
    } catch (error) {
      toast.error('Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProfile = async (editForm) => {
    if (!token || !user) return
    
    setIsLoading(true)
    try {
      const res = await fetch(`/api/professionals/${user.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: editForm.fullName,
          phone: editForm.phone,
          subcategory: editForm.subcategory,
          bio: editForm.bio,
          experience: parseInt(editForm.experience),
          location: {
            country: editForm.country,
            state: editForm.state,
            city: editForm.city
          },
          serviceOptions: {
            inPerson: editForm.inPerson,
            virtual: editForm.virtual
          },
          languages: editForm.languages.split(',').map(l => l.trim()),
          socialLinks: {
            linkedin: editForm.linkedin,
            twitter: editForm.twitter,
            website: editForm.website
          }
        })
      })
      const data = await res.json()
      if (res.ok) {
        setUser(data.professional)
        localStorage.setItem('expertbridge_user', JSON.stringify(data.professional))
        setIsEditProfileDialogOpen(false)
        toast.success('Profile updated successfully!')
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoUpload = async (imageData) => {
    if (!token || !user) return
    
    try {
      const res = await fetch('/api/upload/profile-photo', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ imageData })
      })
      const data = await res.json()
      if (res.ok) {
        // Update local user state with new photo
        const updatedUser = { ...user, profilePhoto: { url: data.url, publicId: data.publicId } }
        setUser(updatedUser)
        localStorage.setItem('expertbridge_user', JSON.stringify(updatedUser))
        toast.success(data.mocked ? 'Photo upload simulated (Cloudinary not configured)' : 'Profile photo updated!')
      } else {
        toast.error(data.error || 'Failed to upload photo')
      }
    } catch (error) {
      toast.error('Failed to upload photo')
    }
  }

  const handleSubscribe = async (planId) => {
    if (!token || !user) return
    
    setIsLoading(true)
    try {
      const res = await fetch('/api/subscriptions/initialize', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId })
      })
      const data = await res.json()
      if (res.ok) {
        if (data.mocked) {
          // For mock payments, activate directly
          const activateRes = await fetch('/api/subscriptions/activate', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ planId, reference: data.reference })
          })
          const activateData = await activateRes.json()
          if (activateRes.ok) {
            setUser(activateData.professional)
            localStorage.setItem('expertbridge_user', JSON.stringify(activateData.professional))
            setIsSubscriptionDialogOpen(false)
            toast.success('Subscription activated! (Paystack not configured - demo mode)')
          }
        } else {
          // Redirect to Paystack
          window.location.href = data.authorization_url
        }
      } else {
        toast.error(data.error || 'Failed to initialize payment')
      }
    } catch (error) {
      toast.error('Failed to initialize payment')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    setUserRole(null)
    localStorage.removeItem('expertbridge_token')
    localStorage.removeItem('expertbridge_user')
    localStorage.removeItem('expertbridge_role')
    setCurrentView('home')
    toast.success('Logged out successfully')
  }

  const fetchAdminData = useCallback(async (authToken) => {
    const headers = { 'Authorization': `Bearer ${authToken || token}` }
    try {
      const [statsRes, pendingRes, allRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/pending', { headers }),
        fetch('/api/admin/professionals?limit=50', { headers })
      ])
      const statsData = await statsRes.json()
      const pendingData = await pendingRes.json()
      const allData = await allRes.json()
      setAdminStats(statsData)
      setPendingProfessionals(pendingData.pending || [])
      setAllProfessionals(allData.professionals || [])
    } catch (error) {
      console.error('Error fetching admin data:', error)
    }
  }, [token])

  const handleApprove = useCallback(async (professionalId) => {
    try {
      const res = await fetch(`/api/admin/approve/${professionalId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success('Professional approved! Email notification sent.')
        fetchAdminData(token)
        // Also refresh public data so categories and featured professionals update
        refreshData()
      } else {
        toast.error('Failed to approve')
      }
    } catch (error) {
      toast.error('Failed to approve')
    }
  }, [token, fetchAdminData, refreshData])

  const handleReject = useCallback(async (professionalId, reason) => {
    try {
      const res = await fetch(`/api/admin/reject/${professionalId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })
      if (res.ok) {
        toast.success('Professional rejected. Email notification sent.')
        fetchAdminData(token)
      } else {
        toast.error('Failed to reject')
      }
    } catch (error) {
      toast.error('Failed to reject')
    }
  }, [token, fetchAdminData])

  const handleDeleteProfessional = useCallback(async (professionalId) => {
    try {
      const res = await fetch(`/api/admin/professionals/${professionalId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success('Professional deleted successfully')
        setIsDeleteDialogOpen(false)
        setProfessionalToDelete(null)
        fetchAdminData(token)
        refreshData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete')
      }
    } catch (error) {
      toast.error('Failed to delete professional')
    }
  }, [token, fetchAdminData, refreshData])

  const viewProfessionalProfile = async (professionalId) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/professionals/${professionalId}`)
      const data = await res.json()
      setSelectedProfessional(data)
      setCurrentView('profile')
    } catch (error) {
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const trackContactClick = async (professionalId) => {
    try {
      await fetch(`/api/professionals/${professionalId}/contact`, { method: 'POST' })
    } catch (error) {
      console.error('Failed to track contact click')
    }
  }

  const submitReview = async (reviewData) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      })
      if (res.ok) {
        toast.success('Review submitted successfully!')
        // Refresh the profile to show the new review
        if (selectedProfessional?.professional?.id) {
          viewProfessionalProfile(selectedProfessional.professional.id)
        }
        return true
      }
      return false
    } catch (error) {
      toast.error('Failed to submit review')
      return false
    }
  }

  // Render Home View
  const renderHomeView = () => (
    <div>
      {/* Hero Section - Using heroSection-2.svg as background */}
      <section 
        className="relative overflow-hidden min-h-[600px] md:min-h-[700px]"
        style={{
          backgroundImage: `url('${HERO_BG_IMAGE}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Content container - positioned on the left side following heroSection-1 layout */}
        <div className="container relative py-16 md:py-24 lg:py-32">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm">
              🌍 Connecting professionals globally
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white">
              Find Verified <span className="text-blue-200">Professionals</span> You Can Trust
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-xl">
              ExpertBridge connects you with verified experts across 20+ categories — lawyers, psychologists, financial advisors, and more. Virtual or in-person, anywhere in the world.
            </p>
            
            {/* Search Box */}
            <div className="mb-8">
              <HeroSearch onSearch={handleSearch} />
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-white/90">
              <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full">
                <CheckCircle className="h-4 w-4" /> Verified Professionals
              </span>
              <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full">
                <Shield className="h-4 w-4" /> Secure Platform
              </span>
              <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full">
                <Globe className="h-4 w-4" /> Global Network
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - Horizontally Scrollable Two Rows */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find the right professional for your needs from our diverse range of expert categories
            </p>
          </div>
          
          {/* Horizontally scrollable container with two rows */}
          <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex flex-col gap-4" style={{ minWidth: 'max-content' }}>
              {/* First Row - First 10 categories */}
              <div className="flex gap-4">
                {CATEGORIES.slice(0, 10).map((category) => {
                  const Icon = category.icon
                  const catData = categories.find(c => c.name === category.name)
                  return (
                    <Card 
                      key={category.name} 
                      className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 group flex-shrink-0 w-[160px]"
                      onClick={() => handleCategoryClick(category.name)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={`w-12 h-12 mx-auto mb-3 rounded-xl ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-medium text-sm mb-1 truncate">{category.name}</h3>
                        <p className="text-xs text-muted-foreground">{catData?.count || 0} experts</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              
              {/* Second Row - Last 10 categories */}
              <div className="flex gap-4">
                {CATEGORIES.slice(10, 20).map((category) => {
                  const Icon = category.icon
                  const catData = categories.find(c => c.name === category.name)
                  return (
                    <Card 
                      key={category.name} 
                      className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 group flex-shrink-0 w-[160px]"
                      onClick={() => handleCategoryClick(category.name)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={`w-12 h-12 mx-auto mb-3 rounded-xl ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-medium text-sm mb-1 truncate">{category.name}</h3>
                        <p className="text-xs text-muted-foreground">{catData?.count || 0} experts</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Scroll indicator */}
          <div className="flex justify-center mt-4">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <ChevronRight className="h-4 w-4 animate-pulse" /> Scroll horizontally to see more categories
            </p>
          </div>
        </div>
      </section>

      {/* Featured Professionals */}
      {featuredProfessionals.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Featured Professionals</h2>
                <p className="text-muted-foreground">Top-rated experts ready to help you</p>
              </div>
              <Button variant="outline" onClick={() => handleSearch()}>
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProfessionals.map((professional) => (
                <ProfessionalCard 
                  key={professional.id} 
                  professional={professional} 
                  onClick={() => viewProfessionalProfile(professional.id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Connect with the right professional in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <Search className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">1. Search</h3>
                <p className="text-muted-foreground">Browse our network of verified professionals by category, location, or specialty.</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">2. Compare</h3>
                <p className="text-muted-foreground">Review profiles, credentials, ratings, and choose the expert that fits your needs.</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                  <Phone className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">3. Connect</h3>
                <p className="text-muted-foreground">Contact professionals directly via phone, email, or schedule a virtual consultation.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Are You a Professional?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals on ExpertBridge and connect with clients worldwide. 
            Create your verified profile today and grow your practice.
          </p>
          <Button size="lg" variant="secondary" onClick={() => setIsRegisterDialogOpen(true)}>
            Join as an Expert <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  )

  // Render Search View
  const renderSearchView = () => (
    <div className="container py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0">
          <SearchFilters 
            onSearch={handleSearch}
            initialCategory={currentSearchParams.category}
            initialLocation={currentSearchParams.location}
            initialKeyword={currentSearchParams.keyword}
          />
        </aside>

        <main className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Search Results</h1>
              <p className="text-muted-foreground">{pagination.total} professionals found</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : searchResults.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No professionals found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters or search criteria</p>
            </Card>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                {searchResults.map((professional) => (
                  <ProfessionalCard 
                    key={professional.id} 
                    professional={professional} 
                    onClick={() => viewProfessionalProfile(professional.id)}
                  />
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <Button 
                      key={page} 
                      variant={page === pagination.page ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleSearch(currentSearchParams.category, currentSearchParams.location, currentSearchParams.keyword, page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )

  // Render Profile View
  const renderProfileView = () => {
    const professional = selectedProfessional?.professional
    const reviews = selectedProfessional?.reviews || []
    const badge = professional ? getProfessionalBadge(professional) : null

    if (!professional) return null

    return (
      <div className="container py-8">
        <Button variant="ghost" className="mb-6" onClick={() => setCurrentView('search')}>
          ← Back to Search
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <Avatar className="h-32 w-32 border-4 border-primary/10">
                    <AvatarImage src={professional.profilePhoto?.url} alt={professional.fullName} />
                    <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                      {professional.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold">{professional.fullName}</h1>
                      {badge && (
                        <Badge className={badge.className}>
                          <badge.icon className="h-3 w-3 mr-1" />
                          {badge.label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg text-muted-foreground mb-2">{professional.category}</p>
                    {professional.subcategory && (
                      <p className="text-sm text-muted-foreground mb-4">{professional.subcategory}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {professional.location?.city}, {professional.location?.state}, {professional.location?.country}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        {professional.experience} years experience
                      </span>
                      {professional.ratings?.count > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          {professional.ratings.average} ({professional.ratings.count} reviews)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>About</CardTitle></CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{professional.bio}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Services Offered</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {professional.serviceOptions?.virtual && (
                    <Badge variant="outline" className="px-4 py-2">
                      <Globe className="h-4 w-4 mr-2" /> Virtual Consultations
                    </Badge>
                  )}
                  {professional.serviceOptions?.inPerson && (
                    <Badge variant="outline" className="px-4 py-2">
                      <MapPin className="h-4 w-4 mr-2" /> In-Person Meetings
                    </Badge>
                  )}
                </div>
                {professional.languages?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Languages:</p>
                    <div className="flex flex-wrap gap-2">
                      {professional.languages.map((lang) => (
                        <Badge key={lang} variant="secondary">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews Section - hide review form if viewing own profile */}
            <ReviewsSection
              reviews={reviews}
              professionalId={professional.id}
              currentUserId={user?.id}
              onSubmitReview={submitReview}
            />
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Contact {professional.fullName?.split(' ')[0]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {professional.phone && (
                  <Button className="w-full" onClick={() => { trackContactClick(professional.id); window.location.href = `tel:${professional.phone}` }}>
                    <Phone className="h-4 w-4 mr-2" /> Call Now
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={() => { trackContactClick(professional.id); window.location.href = `mailto:${professional.email}` }}>
                  <Mail className="h-4 w-4 mr-2" /> Send Email
                </Button>

                {(professional.socialLinks?.linkedin || professional.socialLinks?.twitter || professional.socialLinks?.website) && (
                  <>
                    <Separator />
                    <p className="text-sm font-medium">Social Links</p>
                    <div className="flex gap-2">
                      {professional.socialLinks?.linkedin && (
                        <Button variant="outline" size="icon" onClick={() => window.open(professional.socialLinks.linkedin, '_blank')}>
                          <Linkedin className="h-4 w-4" />
                        </Button>
                      )}
                      {professional.socialLinks?.twitter && (
                        <Button variant="outline" size="icon" onClick={() => window.open(professional.socialLinks.twitter, '_blank')}>
                          <Twitter className="h-4 w-4" />
                        </Button>
                      )}
                      {professional.socialLinks?.website && (
                        <Button variant="outline" size="icon" onClick={() => window.open(professional.socialLinks.website, '_blank')}>
                          <Globe className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Render Dashboard View
  const renderDashboardView = () => {
    if (!user) return null
    const badge = getProfessionalBadge(user)
    const hasActiveSubscription = user.subscription?.status === 'active' && new Date(user.subscription?.endDate) > new Date()
    const isApproved = user.verification?.status === 'approved'

    return (
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user.fullName}</h1>
          <p className="text-muted-foreground">Manage your professional profile and track your performance</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100"><Eye className="h-6 w-6 text-blue-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{user.analytics?.profileViews || 0}</p>
                  <p className="text-sm text-muted-foreground">Profile Views</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100"><MousePointer className="h-6 w-6 text-green-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{user.analytics?.contactClicks || 0}</p>
                  <p className="text-sm text-muted-foreground">Contact Clicks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-100"><Star className="h-6 w-6 text-amber-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{user.ratings?.average || 0}</p>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100"><Award className="h-6 w-6 text-purple-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{user.ratings?.count || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader><CardTitle>Profile Status</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Account Status</span>
                  {badge ? (
                    <Badge className={badge.className}>
                      <badge.icon className="h-3 w-3 mr-1" />
                      {badge.label}
                    </Badge>
                  ) : (
                    <Badge variant={user.verification?.status === 'pending' ? 'secondary' : 'destructive'}>
                      {user.verification?.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {user.verification?.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                      {user.verification?.status?.charAt(0).toUpperCase() + user.verification?.status?.slice(1)}
                    </Badge>
                  )}
                </div>
                {user.verification?.status === 'rejected' && user.verification?.rejectionReason && (
                  <div className="p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                    <strong>Rejection Reason:</strong> {user.verification.rejectionReason}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Category</span>
                  <Badge variant="outline">{user.category}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Experience</span>
                  <span>{user.experience} years</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Location</span>
                  <span>{user.location?.city}, {user.location?.country}</span>
                </div>
                {/* Show upgrade message only for approved users who are not yet subscribed */}
                {isApproved && !hasActiveSubscription && (
                  <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700 mt-4">
                    <strong>Upgrade to Featured:</strong> Subscribe to get the Verified badge and appear in the Featured Experts carousel.
                  </div>
                )}
                {/* Show pending message for non-approved users */}
                {!isApproved && user.verification?.status === 'pending' && (
                  <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700 mt-4">
                    <strong>Pending Approval:</strong> Your profile is being reviewed. Subscription options will be available once approved.
                  </div>
                )}
                {hasActiveSubscription && (
                  <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700 mt-4">
                    <strong>Active Subscription:</strong> Valid until {new Date(user.subscription.endDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline" onClick={() => viewProfessionalProfile(user.id)}>
                <Eye className="h-4 w-4 mr-2" /> View Public Profile
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => setIsEditProfileDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" /> Edit Profile
              </Button>
              {/* Only show subscription button for approved users */}
              {isApproved ? (
                <Button 
                  className="w-full justify-start" 
                  variant={hasActiveSubscription ? "outline" : "default"}
                  onClick={() => setIsSubscriptionDialogOpen(true)}
                >
                  <Crown className="h-4 w-4 mr-2" /> 
                  {hasActiveSubscription ? 'View Subscription' : 'Get Featured'}
                </Button>
              ) : (
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  disabled
                >
                  <Crown className="h-4 w-4 mr-2" /> 
                  Get Featured (Requires Approval)
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Render Admin View
  const renderAdminView = () => {
    if (!user || userRole !== 'admin') return null

    return (
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage professionals and platform settings</p>
        </div>

        {adminStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-blue-600">{adminStats.stats?.totalProfessionals || 0}</p>
                <p className="text-sm text-muted-foreground">Total Professionals</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-amber-600">{adminStats.stats?.pendingApprovals || 0}</p>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-600">{adminStats.stats?.approvedProfessionals || 0}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-red-600">{adminStats.stats?.rejectedProfessionals || 0}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-purple-600">{adminStats.stats?.featuredProfessionals || 0}</p>
                <p className="text-sm text-muted-foreground">Featured</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">Pending Approvals ({pendingProfessionals.length})</TabsTrigger>
            <TabsTrigger value="all">All Professionals</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingProfessionals.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold">All caught up!</h3>
                <p className="text-muted-foreground">No pending approvals at the moment.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingProfessionals.map((professional) => (
                  <AdminPendingCard 
                    key={professional.id} 
                    professional={professional} 
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-4">Professional</th>
                        <th className="text-left p-4">Category</th>
                        <th className="text-left p-4">Location</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Joined</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allProfessionals.map((professional) => (
                        <tr key={professional.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={professional.profilePhoto?.url} />
                                <AvatarFallback>{professional.fullName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{professional.fullName}</p>
                                <p className="text-sm text-muted-foreground">{professional.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">{professional.category}</td>
                          <td className="p-4">{professional.location?.city}, {professional.location?.country}</td>
                          <td className="p-4">
                            <Badge variant={professional.verification?.status === 'approved' ? 'default' : professional.verification?.status === 'pending' ? 'secondary' : 'destructive'}>
                              {professional.verification?.status}
                            </Badge>
                            {professional.featured?.isFeatured && new Date(professional.featured?.featuredUntil) > new Date() && (
                              <Badge className="ml-2 bg-amber-500">
                                <Crown className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(professional.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                setProfessionalToDelete(professional)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Render About View
  const renderAboutView = () => (
    <div className="container py-16">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">About ExpertBridge</h1>
        <p className="text-xl text-muted-foreground">
          Connecting clients with verified professionals across the globe
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-muted-foreground mb-4">
            ExpertBridge was founded with a simple mission: to make it easy for anyone, anywhere in the world, 
            to find and connect with verified professionals they can trust.
          </p>
          <p className="text-muted-foreground">
            Whether you need a lawyer in Lagos, a financial advisor in London, or a psychologist in Johannesburg, 
            ExpertBridge helps you discover qualified experts who can help you achieve your goals.
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8">
          <img 
            src="https://images.unsplash.com/photo-1580983558189-84200466afb8?crop=entropy&cs=srgb&fm=jpg&w=600" 
            alt="Professional team" 
            className="rounded-xl shadow-lg"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card>
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Verified Professionals</h3>
            <p className="text-muted-foreground">Every professional on our platform goes through a verification process to ensure quality and trust.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <Globe className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Global Network</h3>
            <p className="text-muted-foreground">Find experts anywhere in the world, with virtual consultation options for maximum flexibility.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">20+ Categories</h3>
            <p className="text-muted-foreground">From lawyers to life coaches, find the right professional for any need across diverse categories.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Footer
  const renderFooter = () => (
    <footer className="border-t bg-muted/40">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">EB</span>
              </div>
              <span className="font-bold">ExpertBridge</span>
            </div>
            <p className="text-sm text-muted-foreground">Connecting clients with verified professionals worldwide.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {CATEGORIES.slice(0, 5).map(cat => (
                <li key={cat.name}>
                  <button onClick={() => handleCategoryClick(cat.name)} className="hover:text-primary transition-colors">{cat.name}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => setCurrentView('about')} className="hover:text-primary">About Us</button></li>
              <li><button className="hover:text-primary">How It Works</button></li>
              <li><button className="hover:text-primary">Contact</button></li>
              <li><button className="hover:text-primary">Terms of Service</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">For Professionals</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => setIsRegisterDialogOpen(true)} className="hover:text-primary">Join as Expert</button></li>
              <li><button className="hover:text-primary">Pricing</button></li>
              <li><button className="hover:text-primary">Success Stories</button></li>
            </ul>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2025 ExpertBridge. All rights reserved.</p>
          <div className="flex gap-4">
            <button className="hover:text-primary">Privacy Policy</button>
            <button className="hover:text-primary">Terms</button>
          </div>
        </div>
      </div>
    </footer>
  )

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">EB</span>
            </div>
            <span className="font-bold text-xl hidden sm:block">ExpertBridge</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => setCurrentView('home')} className="text-sm font-medium hover:text-primary transition-colors">Home</button>
            <button onClick={() => handleSearch('', '', '')} className="text-sm font-medium hover:text-primary transition-colors">Find Experts</button>
            <button onClick={() => setCurrentView('about')} className="text-sm font-medium hover:text-primary transition-colors">About</button>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setCurrentView(userRole === 'admin' ? 'admin' : 'dashboard')}>
                  <User className="h-4 w-4 mr-2" />
                  {user.fullName?.split(' ')[0] || 'Dashboard'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setIsLoginDialogOpen(true)}>Login</Button>
                <Button size="sm" onClick={() => setIsRegisterDialogOpen(true)}>Join as Expert</Button>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setIsAdminLoginDialogOpen(true)}>Admin</Button>
              </>
            )}

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t p-4 space-y-2">
            <button onClick={() => { setCurrentView('home'); setIsMenuOpen(false); }} className="block w-full text-left py-2">Home</button>
            <button onClick={() => { handleSearch('', '', ''); setIsMenuOpen(false); }} className="block w-full text-left py-2">Find Experts</button>
            <button onClick={() => { setCurrentView('about'); setIsMenuOpen(false); }} className="block w-full text-left py-2">About</button>
          </div>
        )}
      </header>

      {/* Dialogs */}
      <LoginDialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen} onLogin={handleLogin} isLoading={isLoading} />
      <AdminLoginDialog open={isAdminLoginDialogOpen} onOpenChange={setIsAdminLoginDialogOpen} onLogin={handleAdminLogin} isLoading={isLoading} />
      <RegisterDialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen} onRegister={handleRegister} isLoading={isLoading} />
      <EditProfileDialog 
        open={isEditProfileDialogOpen} 
        onOpenChange={setIsEditProfileDialogOpen} 
        user={user}
        onSave={handleEditProfile}
        onPhotoUpload={handlePhotoUpload}
        isLoading={isLoading}
      />
      <SubscriptionDialog
        open={isSubscriptionDialogOpen}
        onOpenChange={setIsSubscriptionDialogOpen}
        onSubscribe={handleSubscribe}
        isLoading={isLoading}
        currentSubscription={user?.subscription}
      />
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        professional={professionalToDelete}
        onConfirm={handleDeleteProfessional}
        isLoading={isLoading}
      />

      <main className="flex-1">
        {currentView === 'home' && renderHomeView()}
        {currentView === 'search' && renderSearchView()}
        {currentView === 'profile' && renderProfileView()}
        {currentView === 'dashboard' && renderDashboardView()}
        {currentView === 'admin' && renderAdminView()}
        {currentView === 'about' && renderAboutView()}
      </main>
      
      {renderFooter()}
    </div>
  )
}
