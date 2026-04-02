import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import MarketingNavbar from '../components/MarketingNavbar'

function TermsOfService() {
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
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight">Terms of Service</h1>
          <p className="mt-4 text-gray-600">Last updated: April 1, 2026</p>

          <div className="mt-8 space-y-8 text-gray-700 leading-relaxed">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Lead Stitch, you agree to these Terms of Service. If you do not agree, do not use the service.
              </p>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">2. Service Scope</h2>
              <p>
                Lead Stitch provides tools for requirement capture, AI-assisted decision-maker targeting, profile enrichment,
                outreach workflows, and campaign analytics for B2B teams.
              </p>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">3. Account Responsibilities</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>You are responsible for account credentials and activity under your account.</li>
                <li>You must provide accurate onboarding and billing information where required.</li>
                <li>You must comply with applicable email, data, and privacy regulations in your campaigns.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">4. Acceptable Use</h2>
              <p>
                You may not use the platform for unlawful outreach, abuse, unauthorized scraping, spam, security violations,
                or infringement of third-party rights.
              </p>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">5. Intellectual Property</h2>
              <p>
                Lead Stitch and related branding, software, and design elements are protected by applicable intellectual property laws.
                You retain ownership of your content and campaign materials.
              </p>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">6. Availability and Changes</h2>
              <p>
                We may improve, modify, or discontinue parts of the service. We may also release updates to maintain security,
                reliability, and product quality.
              </p>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">7. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Lead Stitch is not liable for indirect, incidental, or consequential damages
                arising from use of the platform.
              </p>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">8. Termination</h2>
              <p>
                We may suspend or terminate accounts that violate these terms or create security and compliance risk.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default TermsOfService
