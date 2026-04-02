import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import MarketingNavbar from '../components/MarketingNavbar'

function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white">
      <MarketingNavbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mb-8 sm:mb-10">
          <Link to="/" className="inline-flex items-center text-sm font-semibold text-blue-700 hover:text-blue-800">
            Back to Home
          </Link>
        </div>

        <section className="rounded-3xl bg-white/90 backdrop-blur border border-gray-200 shadow-xl p-6 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700 mb-3">Legal</p>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight">Privacy Policy</h1>
          <p className="mt-4 text-gray-600">Last updated: April 1, 2026</p>

          <div className="mt-8 space-y-8 text-gray-700 leading-relaxed">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">1. Overview</h2>
              <p>
                Lead Stitch provides AI-powered B2B lead generation, profile enrichment, and campaign management workflows.
                This policy explains how we collect, use, store, and protect information when you use our website and platform.
              </p>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">2. Data We Collect</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Account data such as name, email address, and organization details.</li>
                <li>Usage data such as page interactions, session activity, and feature usage events.</li>
                <li>Campaign data such as requirements, lead lists, outreach templates, and performance metrics.</li>
                <li>Technical data such as browser type, device details, IP metadata, and log information.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">3. How We Use Data</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>To deliver lead discovery, enrichment, and campaign analytics features.</li>
                <li>To improve platform reliability, model quality, and user experience.</li>
                <li>To provide customer support, onboarding, and account security controls.</li>
                <li>To communicate product updates, service notices, and important legal changes.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">4. Data Sharing</h2>
              <p>
                We do not sell personal data. We may share limited data with infrastructure, analytics, and enrichment partners
                strictly to operate the service, under contractual and confidentiality safeguards.
              </p>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">5. Security and Retention</h2>
              <p>
                We apply reasonable technical and organizational controls to protect data in transit and at rest. Data is retained
                for operational, legal, and compliance needs, and may be deleted or anonymized when no longer required.
              </p>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">6. Your Rights</h2>
              <p>
                Subject to applicable law, you may request access, correction, export, or deletion of your data. You may also
                object to certain processing activities. Contact support to submit a request.
              </p>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">7. Contact</h2>
              <p>For privacy requests or questions, contact the Lead Stitch support team through your registered account channel.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default PrivacyPolicy
