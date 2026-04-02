import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AOS from 'aos'
import { motion } from 'framer-motion'
import AnimatedNumber from '../components/AnimatedNumber'
import MarketingNavbar from '../components/MarketingNavbar'
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
  image: string
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
      image: '/images/Step 1 – Define Your Requirement (Form Screen).png',
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
      image: '/images/Step 2 – Discover Decision‑Makers (Table + Filters).png',
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
      image: '/images/Step 3 – Enrich Profiles (Profile Drawer).png',
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
      image: '/images/Step 4 – Create & Launch Campaign (Editor + Preview).png',
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
      image: '/images/Step 5 – Track & Optimize (Analytics Dashboard).png',
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
    <div className="min-h-screen bg-white">
      <MarketingNavbar />

      {/* Hero Section - Modern SaaS Style */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-100 via-purple-100 to-white pt-16 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200 mb-6">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-sm font-semibold text-gray-700">Early access – MVP launch cohort</span>
          </div>
          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
            AI-Powered <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">B2B Lead Generation</span> from Research to Outreach
          </h1>
          {/* Subheadline */}
          <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Tell us your target market, and Lead Stitch identifies decision-makers, enriches verified emails, and helps your team launch campaigns quickly.
          </p>
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/register"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-10 py-3 sm:py-5 rounded-full text-base sm:text-lg font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300 text-center"
            >
              Start Free Trial
            </Link>
            <Link
              to="/register?intent=demo"
              className="bg-white text-gray-900 px-6 sm:px-10 py-3 sm:py-5 rounded-full text-base sm:text-lg font-bold border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 text-center"
            >
              Talk to Sales
            </Link>
          </div>
          {/* Trust Bar */}
          <div className="flex flex-wrap justify-center gap-6 mt-8 opacity-80">
            <span className="text-gray-500 text-sm flex items-center gap-2"><svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Built for B2B founders and sales teams</span>
            <span className="text-gray-500 text-sm flex items-center gap-2"><svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Decision-maker targeting and verified emails</span>
            <span className="text-gray-500 text-sm flex items-center gap-2"><svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Book a guided sales demo</span>
          </div>
        </div>
        {/* Decorative Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#eff6ff"/>
          </svg>
        </div>
      </section>

            {/* How It Works Section - Timeline Style */}
      <section id="how-it-works" className="pt-10 pb-24 relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: "spring", stiffness: 50 }}
            className="text-center mb-20"
          >
            <motion.h2
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2, type: "spring", stiffness: 80 }}
              className="text-5xl md:text-6xl font-black text-gray-900 mb-6"
            >
              From Requirement to
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Campaign Launch in 5 Steps
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              A crystal-clear process your team can understand at first glance.
            </motion.p>
          </motion.div>

          <div className="max-w-5xl mx-auto space-y-8">
            {steps.map((step, index) => {
              const bgColors = ["bg-blue-50", "bg-purple-50", "bg-gray-50", "bg-blue-50", "bg-purple-50"]
              const numberColors = [
                "from-blue-500 to-blue-700",
                "from-purple-500 to-purple-700",
                "from-pink-500 to-pink-700",
                "from-blue-500 to-purple-700",
                "from-purple-500 to-pink-700",
              ]
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px 0px -100px 0px" }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="overflow-hidden mb-8"
                >
                  <motion.div whileHover={{ y: -8 }} className={`${bgColors[index % bgColors.length]} rounded-3xl shadow-lg border border-gray-200/50`}>
                    <div className="bg-white p-6 sm:p-8 rounded-3xl">
                      <div className="flex items-start gap-5">
                        <span
                          className={`inline-flex items-center justify-center min-w-14 h-14 rounded-full bg-gradient-to-br ${numberColors[index % numberColors.length]} text-white text-2xl font-black shadow-lg`}
                        >
                          {step.number}
                        </span>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                            <h3 className="text-2xl font-black text-gray-900">{step.title}</h3>
                            <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-xs sm:text-sm font-bold px-4 py-2 rounded-full">
                              {step.timeEstimate}
                            </span>
                          </div>
                          <p className="text-gray-600 leading-relaxed mb-4">{step.description}</p>
                          <div className="p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                            <p className="text-sm sm:text-base text-purple-900 font-medium leading-relaxed">
                              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Example:</span>{' '}
                              {step.example}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section - Stagger Fade Animation */}
      <section id="features" className="py-20 relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center mb-16"
          >
            <motion.h2
              initial={false}
              animate={false}
              className="text-5xl md:text-6xl font-black text-gray-900 mb-6"
            >
              Everything You Need to
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Generate & Convert Leads
              </span>
            </motion.h2>
            <motion.p
              initial={false}
              animate={false}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Powerful features designed to streamline your B2B lead generation and email marketing workflow.
            </motion.p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white p-8 rounded-3xl border border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Gradient Border on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ padding: '2px' }}>
                  <div className="bg-white h-full w-full rounded-3xl"></div>
                </div>
                
                {/* Icon with bounce animation */}
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    {feature.icon}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits/Stats Section - Zoom & Rotate Animation */}
      <section className="py-20 relative bg-blue-50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMTJjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: "spring", stiffness: 50 }}
            className="text-center mb-16"
          >
            <h2
              className="text-5xl md:text-6xl font-black text-gray-900 mb-6"
              style={{ transformStyle: "preserve-3d" }}
            >
              Results That Speak
            </h2>
            <p
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Data-driven results from our AI-powered platform
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white p-10 rounded-3xl shadow-md hover:shadow-lg transition-all duration-300 text-center relative overflow-hidden group border border-gray-100"
              >
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                <div className="text-7xl font-black text-blue-600 mb-4 relative z-10">
                  <AnimatedNumber value={benefit.stat} duration={2000} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 relative z-10">
                  {benefit.label}
                </h3>
                <p className="text-gray-600 leading-relaxed relative z-10">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Accordion Slide Animation */}
      <section id="faq" className="py-20 relative bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, type: "spring", stiffness: 80 }}
            className="text-center mb-16"
          >
            <motion.h2
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl md:text-6xl font-black text-gray-900 mb-6"
            >
              Frequently Asked
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Questions
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Everything you need to know about our product and services
            </motion.p>
          </motion.div>

          <div className="space-y-4 mt-12">
            {displayedFaqs.map((faq, index) => {
              const faqKey = index;
              const isOpen = openFaq === faqKey;
              return (
                <motion.div
                  key={faqKey}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.08,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ scale: 1.01, x: 5 }}
                  className="bg-white rounded-2xl border-2 border-gray-200 hover:border-purple-300 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  <motion.button
                    onClick={() => setOpenFaq(isOpen ? null : faqKey)}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg font-bold text-gray-900 pr-8">
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                      className="flex-shrink-0"
                    >
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </motion.button>
                  <motion.div
                    initial={false}
                    animate={{ 
                      height: isOpen ? 'auto' : 0, 
                      opacity: isOpen ? 1 : 0,
                      y: isOpen ? 0 : -10
                    }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={false}
                      animate={{ opacity: isOpen ? 1 : 0 }}
                      transition={{ duration: 0.3, delay: isOpen ? 0.1 : 0 }}
                      className="px-8 pb-6 pt-0"
                    >
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-r from-indigo-50 to-purple-50">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 0],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -180, 0],
            }}
            transition={{
              duration: 35,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 leading-tight">
              Ready to <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Transform</span> Your Lead Generation?
            </h2>
            <p className="text-2xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of businesses using Lead Stitch to identify, reach, and convert their ideal customers with AI-powered precision.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/register"
                  className="inline-block bg-white text-gray-900 px-12 py-5 rounded-full text-xl font-black hover:bg-gray-100 transition-all shadow-2xl"
                >
                  Start Free Trial →
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/register?intent=demo"
                  className="inline-block bg-transparent border-3 border-gray-300 text-gray-700 px-12 py-5 rounded-full text-xl font-bold hover:bg-gray-100 transition-all"
                >
                  Book Demo
                </Link>
              </motion.div>
            </div>
            
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-8 text-gray-500 text-lg"
            >
              ✓ No credit card required  •  ✓ 14-day free trial  •  ✓ Cancel anytime
            </motion.p>
          </motion.div>
        </div>
      </section>

            {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <h3 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                Lead Stitch
              </h3>
              <p className="text-gray-400 leading-relaxed mb-6 max-w-md">
                AI-powered B2B lead generation and email marketing platform.
                Transform your sales pipeline with intelligent automation.
              </p>
              <div className="flex gap-4">
                <Link
                  to="/register?intent=demo"
                  className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:shadow-lg transition-all"
                >
                  Book a Demo
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 text-lg">Product</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#features" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                    How It Works
                  </a>
                </li>
                <li>
                  <Link to="/register?intent=demo" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                    Book Demo
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 text-lg">Company</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#faq" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                    FAQ
                  </a>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                    Start Free Trial
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400">&copy; 2024 Lead Stitch. All rights reserved.</p>
              <div className="flex gap-6 text-sm">
                <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default Home


