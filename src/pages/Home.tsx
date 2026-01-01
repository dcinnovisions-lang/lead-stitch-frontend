import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AOS from 'aos'
import AnimatedNumber from '../components/AnimatedNumber'
import { useAppSelector } from '../store/hooks'
import { RootState } from '../types/redux/rootState.types'

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

interface Step {
  number: string
  title: string
  description: string
  timeEstimate: string
  icon: React.ReactNode
  example: string
}

interface FAQ {
  question: string
  answer: string
}

interface Benefit {
  stat: string | number
  label: string
  description: string
}

function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAppSelector((state: RootState) => state.auth)

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard')
    }

    // Initialize AOS on component mount
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: false,
      mirror: true,
      offset: 100,
    })

    // Refresh AOS on scroll
    const handleScroll = () => {
      AOS.refresh()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      AOS.refresh()
    }
  }, [isAuthenticated, navigate])

  const features: Feature[] = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI-Powered Lead Identification',
      description: 'Leverage advanced AI to automatically identify decision-makers and key stakeholders for your business requirements.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Profile Discovery',
      description: 'Automatically discover and enrich professional profiles of decision-makers using Apollo.io database with comprehensive information.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Email Enrichment',
      description: 'Enrich profiles with verified email addresses using industry-leading data providers for maximum deliverability.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Campaign Management',
      description: 'Create, manage, and track email campaigns with advanced analytics and automated follow-up sequences.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Real-Time Analytics',
      description: 'Track email opens, clicks, replies, and conversions with comprehensive analytics and reporting dashboards.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with GDPR compliance, data encryption, and secure API integrations.',
    },
  ]

  const steps: Step[] = [
    {
      number: '01',
      title: 'Define Your Requirement',
      description: 'Simply describe your business requirement, target industry, and location. Our AI understands your needs.',
      timeEstimate: '2 minutes',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      example: 'Example: "I am a book seller and I need to sell books across the Netherlands"',
    },
    {
      number: '02',
      title: 'AI Identifies Decision Makers',
      description: 'Our advanced AI analyzes your requirement and identifies relevant decision-makers and key stakeholders.',
      timeEstimate: '30 seconds',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      example: 'Output: CTO, CEO, Owner, Marketing Director',
    },
    {
      number: '03',
      title: 'Discover Profiles',
      description: 'Automatically discover and enrich professional profiles using Apollo.io database with professional information and contact details.',
      timeEstimate: '5-15 minutes',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      example: 'Profiles found: Name, Title, Location, Company, Experience',
    },
    {
      number: '04',
      title: 'Enrich with Email Addresses',
      description: 'Get verified email addresses for each decision-maker using industry-leading data enrichment services.',
      timeEstimate: '2-5 minutes',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      example: 'Email addresses verified via Apollo.io with 95%+ deliverability',
    },
    {
      number: '05',
      title: 'Launch Email Campaigns',
      description: 'Create personalized email campaigns, track performance, and automate follow-up sequences.',
      timeEstimate: '10 minutes',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      example: 'Track opens, clicks, replies, and conversions in real-time',
    },
  ]

  const faqs: FAQ[] = [
    {
      question: 'How does the AI-powered decision maker identification work?',
      answer: 'Our platform uses advanced AI (OpenAI GPT-4o mini) to analyze your business requirements and automatically identify the most relevant decision-makers for your industry. Simply describe what you need (e.g., "book seller in Netherlands"), and our AI will identify roles like CTO, CEO, Owner, and other key stakeholders based on your specific use case.',
    },
    {
      question: 'Is profile discovery legal and compliant?',
      answer: 'We take compliance seriously. Our profile discovery uses Apollo.io, a trusted data provider that complies with all data privacy regulations. We only access publicly available information and ensure all data handling complies with GDPR and other applicable data protection laws. All data is securely stored and encrypted.',
    },
    {
      question: 'How accurate are the email addresses from email enrichment?',
      answer: 'We use Apollo.io, an industry-leading data enrichment service, to find and verify email addresses. Our platform achieves 95%+ email deliverability rates, ensuring your campaigns reach the intended recipients. All emails are verified before being added to your lead database.',
    },
    {
      question: 'What email tracking features are available?',
      answer: 'Our platform provides comprehensive email tracking including open rates, click-through rates, reply tracking, and conversion monitoring. You can track individual email performance, campaign analytics, and set up automated follow-up sequences based on recipient engagement. All tracking data is displayed in real-time on your dashboard.',
    },
    {
      question: 'Is my data secure and GDPR compliant?',
      answer: 'Yes, absolutely. We implement enterprise-grade security measures including data encryption, secure API integrations, and GDPR-compliant data handling practices. All personal data is stored securely, and we follow strict data retention policies. Users have full control over their data and can export or delete it at any time.',
    },
    {
      question: 'Can I integrate my own email account?',
      answer: 'Yes, you can integrate your email account with our platform. We support multiple email providers and use AWS SES for reliable email delivery. You can configure SMTP settings and send emails through your own domain to maintain sender reputation and improve deliverability.',
    },
    {
      question: 'How long does it take to generate leads?',
      answer: 'The entire process is fast and automated. Defining your requirement takes about 2 minutes, AI identification happens in 30 seconds, profile discovery takes 5-15 minutes depending on the number of profiles, email enrichment takes 2-5 minutes, and you can launch campaigns in about 10 minutes. Most users have their first leads ready within 20-30 minutes.',
    },
    {
      question: 'What information is collected from LinkedIn profiles?',
      answer: 'We collect publicly available information including LinkedIn profile URL, name, profession/title, location, experience details, and company information. This data is then enriched with verified email addresses to create comprehensive lead profiles for your campaigns.',
    },
    {
      question: 'Can I customize email campaigns and templates?',
      answer: 'Absolutely! Our platform includes a full email template editor where you can create personalized campaigns. You can use variables to personalize emails with recipient names, companies, and other profile data. You can also schedule campaigns, set up automated follow-up sequences, and A/B test different templates.',
    },
    {
      question: 'What happens if I need to cancel or export my data?',
      answer: 'You have full control over your data at all times. You can export all your leads, campaigns, and analytics data in standard formats (CSV, JSON) at any time. If you cancel your subscription, you can export your data before cancellation, and we\'ll securely delete your data according to our data retention policies.',
    },
    {
      question: 'Do I need technical knowledge to use Lead Stitch?',
      answer: 'Not at all! Lead Stitch is designed to be user-friendly and intuitive. The entire process is guided - from entering your business requirement to launching campaigns. Our AI handles the complex work of identifying decision-makers, and our interface makes it easy to manage leads and campaigns without any technical expertise.',
    },
    {
      question: 'What is included in the free trial?',
      answer: 'The 14-day free trial includes full access to all features: AI-powered decision maker identification, profile discovery via Apollo.io, email enrichment, campaign creation and management, email tracking, and analytics. No credit card is required to start your trial. You can explore all features and generate real leads during your trial period.',
    },
  ]

  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [showAllFaqs, setShowAllFaqs] = useState<boolean>(false)
  
  // Show first 6 FAQs initially, rest on "View More"
  const initialFaqCount = 6
  const displayedFaqs = showAllFaqs ? faqs : faqs.slice(0, initialFaqCount)

  const benefits: Benefit[] = [
    {
      stat: '10x',
      label: 'Faster Lead Generation',
      description: 'Automate the entire lead generation process and save hours of manual research.',
    },
    {
      stat: '95%',
      label: 'Email Deliverability',
      description: 'High-quality, verified email addresses ensure your messages reach the inbox.',
    },
    {
      stat: '3x',
      label: 'Higher Conversion Rates',
      description: 'Target the right decision-makers at the right time with personalized campaigns.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                  Lead Stitch
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-gray-900 px-4 py-2 text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="relative overflow-hidden pt-16 pb-20 bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20"
        data-aos="fade-up"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left">
              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-5 leading-tight" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                AI-Powered B2B Lead Generation
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">
                  & Email Marketing Platform
                </span>
              </h1>
              
              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-gray-600 mb-4 leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                Generate <span className="font-semibold text-blue-600">100+ qualified leads</span> in under 30 minutes. 
                Automatically identify decision-makers, enrich with verified emails, and launch targeted campaigns.
              </p>

              {/* Quick Stats - Real Features */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="font-semibold">AI-Powered Identification</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold">Email Enrichment</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="font-semibold">Campaign Management</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-4">
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center"
                >
                  Get Started Free
                </Link>
                <button 
                  onClick={() => {
                    const element = document.getElementById('how-it-works');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-gray-700 hover:text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-gray-300 hover:border-gray-400 transition-all bg-white"
                >
                  See How It Works
                </button>
              </div>
              
              <p className="text-sm text-gray-500">No credit card required • Start building your pipeline today</p>
            </div>

            {/* Right Column - Visual Element */}
            <div className="relative hidden lg:block" data-aos="fade-left" data-aos-delay="200">
              <div className="relative">
                {/* Dashboard Image with Frame */}
                <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
                  {/* Browser Bar */}
                  <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-500 ml-4">
                      leadstitch.com/dashboard
                    </div>
                  </div>
                  
                  {/* Dashboard Image - Free license from Unsplash - Team Collaboration with Data */}
                  <div className="relative h-[500px] overflow-hidden bg-gradient-to-br from-blue-50 to-white">
                    <img
                      src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop&q=80"
                      alt="Team collaboration working with analytics dashboard and data visualization"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        // Fallback images
                        const target = e.target as HTMLImageElement
                        target.src = 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop&q=80'
                      }}
                    />
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3 border border-gray-200 animate-float z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">Email Sent</div>
                      <div className="text-xs text-gray-500">+25 this hour</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3 border border-gray-200 animate-float-delayed z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">Growth Rate</div>
                      <div className="text-xs text-gray-500">+34% this week</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Visual - Simplified */}
            <div className="lg:hidden mt-8" data-aos="fade-up" data-aos-delay="200">
              <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop&q=80"
                  alt="Team collaboration with analytics dashboard"
                  className="w-full h-64 object-cover"
                  loading="lazy"
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    // Fallback images
                    const target = e.target as HTMLImageElement
                    target.src = 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop&q=80'
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/95 p-3 rounded-lg text-center border border-gray-200 shadow-sm">
                      <div className="text-xl font-bold text-blue-600">
                        <AnimatedNumber value={1247} duration={2000} />
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Leads</div>
                    </div>
                    <div className="bg-white/95 p-3 rounded-lg text-center border border-gray-200 shadow-sm">
                      <div className="text-xl font-bold text-green-600">
                        <AnimatedNumber value="94%" duration={2000} />
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Delivered</div>
                    </div>
                    <div className="bg-white/95 p-3 rounded-lg text-center border border-gray-200 shadow-sm">
                      <div className="text-xl font-bold text-purple-600">
                        <AnimatedNumber value="18%" duration={2000} />
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Opened</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 relative" data-aos="fade-up" data-aos-delay="100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              Everything You Need to Generate & Convert Leads
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to streamline your B2B lead generation and email marketing workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-gray-200/60 hover:border-blue-300/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-transparent group-hover:from-blue-50/40 group-hover:to-transparent transition-all duration-300 rounded-2xl"></div>
                
                {/* Icon without glow effect */}
                <div className="relative mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-all duration-300">
                    {feature.icon}
                  </div>
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 relative bg-white/50" data-aos="fade-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From requirement to revenue in five simple steps
            </p>
          </div>
          
          {/* Desktop Timeline View */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200"></div>
              
              <div className="grid grid-cols-5 gap-6 relative">
                {steps.map((step, index) => (
                  <div key={index} className="relative" data-aos="fade-up" data-aos-delay={index * 150}>
                    {/* Arrow connector (except for last item) */}
                    {index < steps.length - 1 && (
                      <div className="absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-400 to-blue-200 z-0" style={{ width: 'calc(100% - 1.5rem)' }}>
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-6 border-l-blue-400 border-t-3 border-t-transparent border-b-3 border-b-transparent"></div>
                      </div>
                    )}
                    
                    <div className="group relative bg-white rounded-2xl border border-gray-200 hover:border-blue-300 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                      {/* Step number and icon header */}
                      <div className="relative bg-gradient-to-br from-blue-50 to-white px-6 pt-6 pb-4 border-b border-gray-100">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-all duration-300">
                              <span className="text-sm font-bold">{step.number}</span>
                            </div>
                            <div className="flex-shrink-0 w-8 h-8 text-blue-600 opacity-70 group-hover:opacity-100 transition-opacity">
                              {step.icon}
                            </div>
                          </div>
                          <div className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                            {step.timeEstimate}
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {step.title}
                        </h3>
                      </div>
                      
                      <div className="p-6">
                        <p className="text-gray-600 leading-relaxed text-sm mb-4">
                          {step.description}
                        </p>
                        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
                          <p className="text-xs text-blue-800 font-medium leading-relaxed">
                            {step.example}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile/Tablet View */}
          <div className="lg:hidden space-y-5">
            {steps.map((step, index) => (
              <div key={index} className="relative" data-aos="fade-right" data-aos-delay={index * 100}>
                {/* Vertical timeline line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-5 top-16 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-blue-100"></div>
                )}
                
                <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-blue-300 shadow-md hover:shadow-lg transition-all duration-300 ml-10 overflow-hidden">
                  {/* Step number and icon header */}
                  <div className="relative bg-gradient-to-br from-blue-50 to-white px-5 pt-5 pb-3 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center text-white shadow-sm">
                          <span className="text-xs font-bold">{step.number}</span>
                        </div>
                        <div className="flex-shrink-0 w-7 h-7 text-blue-600 opacity-70">
                          {step.icon}
                        </div>
                      </div>
                      <div className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                        {step.timeEstimate}
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {step.title}
                    </h3>
                  </div>
                  
                  <div className="p-5">
                    <p className="text-gray-600 leading-relaxed text-sm mb-3">
                      {step.description}
                    </p>
                    <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100/50">
                      <p className="text-xs text-blue-800 font-medium leading-relaxed">
                        {step.example}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits/Stats Section */}
      <section className="py-12 relative" data-aos="fade-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="group relative bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/60 hover:border-blue-300/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center"
                data-aos="zoom-in"
                data-aos-delay={index * 150}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-transparent group-hover:from-blue-50/40 group-hover:to-transparent transition-all duration-500 rounded-2xl"></div>
                
                <div className="relative z-10">
                  {/* Stat number with animation */}
                  <div className="relative inline-block mb-4">
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">
                      <AnimatedNumber value={benefit.stat} duration={2000} />
                    </div>
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                    {benefit.label}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 relative bg-gradient-to-br from-gray-50 to-white" data-aos="fade-up">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about Lead Stitch
            </p>
          </div>
          
          <div className="space-y-4">
            {displayedFaqs.map((faq, index) => {
              const faqKey = faq.question; // Use question as unique identifier
              const isOpen = openFaq === faqKey;
              
              return (
                <div
                  key={faqKey}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  data-aos="fade-up"
                  data-aos-delay={index * 50}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : faqKey)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg font-semibold text-gray-900 pr-8">
                      {faq.question}
                    </span>
                    <svg
                      className={`w-5 h-5 text-blue-600 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-6 pb-5 pt-0">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* View More / View Less Button */}
          {faqs.length > initialFaqCount && (
            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setShowAllFaqs(!showAllFaqs)
                  setOpenFaq(null) // Close any open FAQ when toggling
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {showAllFaqs ? (
                  <>
                    <span>View Less</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    <span>View More FAQs</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
          
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <Link
              to="/register"
              className="inline-block bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-500 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Lead Generation?
          </h2>
          <p className="text-xl text-blue-50/90 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using Lead Stitch to identify, reach, and convert their ideal customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Start Free Trial
            </Link>
            <Link
              to="/login"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">Lead Stitch</h3>
              <p className="text-gray-400">
                AI-powered B2B lead generation and email marketing platform.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Lead Stitch. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Add animation styles */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 3s ease-in-out infinite;
          animation-delay: 1.5s;
        }
      `}</style>
    </div>
  )
}

export default Home
