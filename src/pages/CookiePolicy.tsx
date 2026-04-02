import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import MarketingNavbar from '../components/MarketingNavbar'

function CookiePolicy() {
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
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight">Cookie Policy</h1>
          <p className="mt-4 text-gray-600">Last updated: April 1, 2026</p>

          <div className="mt-8 space-y-8 text-gray-700 leading-relaxed">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">1. What Cookies Are</h2>
              <p>
                Cookies are small text files stored on your browser to help websites remember preferences, sessions, and analytics events.
              </p>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">2. How Lead Stitch Uses Cookies</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Essential cookies for sign-in sessions, security checks, and core application functionality.</li>
                <li>Preference cookies to remember UI settings and interaction choices.</li>
                <li>Analytics cookies to understand feature usage and improve product performance.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">3. Third-Party Technologies</h2>
              <p>
                Some services we use for analytics, infrastructure, or support may set cookies or similar technologies under their own
                policies and contractual terms.
              </p>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">4. Managing Cookie Preferences</h2>
              <p>
                You can control or delete cookies through browser settings. Disabling essential cookies may affect platform functionality,
                including login and secure session behavior.
              </p>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">5. Policy Updates</h2>
              <p>
                We may update this policy to reflect legal, technical, or product changes. Significant updates will be reflected with an
                updated effective date.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default CookiePolicy
