import Layout from '../components/Layout'
import EmailSMTPConfig from '../components/EmailSMTPConfig'

function Integrations() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations</h1>
          <p className="text-gray-600">Manage your third-party service connections</p>
        </div>

        {/* SMTP Configuration Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8">
            <EmailSMTPConfig />
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Integrations
