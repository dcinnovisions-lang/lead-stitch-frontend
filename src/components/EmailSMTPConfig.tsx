import React, { useState, useEffect } from 'react'
import { AxiosError } from 'axios'
import api from '../config/api'
import Modal from './Modal'
import type { SMTPCredential, SMTPCredentialFormData, SMTPProvider, SMTPCredentialsResponse, TestConnectionResponse, TestEmailResponse } from '../types/api/integration.types'
import type { ModalConfig } from '../utils/modal'

interface FormErrors {
    email?: string
    password?: string
    smtp_host?: string
    smtp_port?: string
    username?: string
}

function EmailSMTPConfig() {
    const [credentials, setCredentials] = useState<SMTPCredential[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [saving, setSaving] = useState<boolean>(false)
    const [testing, setTesting] = useState<boolean>(false)
    const [testingCredentialId, setTestingCredentialId] = useState<number | null>(null) // Track which credential is being tested
    const [showForm, setShowForm] = useState<boolean>(false)
    const [selectedProviderType, setSelectedProviderType] = useState<SMTPProvider | null>(null) // 'gmail' or 'outlook'
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [modal, setModal] = useState<ModalConfig | null>(null)
    const [formData, setFormData] = useState<SMTPCredentialFormData>({
        provider: '',
        email: '',
        smtp_host: '',
        smtp_port: 587,
        smtp_secure: false,
        username: '',
        password: '',
        display_name: '',
    })
    const [errors, setErrors] = useState<FormErrors>({})
    const [testEmails, setTestEmails] = useState<Record<number, string>>({}) // Object to store test emails for each credential ID

    useEffect(() => {
        fetchCredentials()

        // Check for OAuth callback results
        const urlParams = new URLSearchParams(window.location.search)
        const outlookConnected = urlParams.get('outlook_connected')
        const outlookError = urlParams.get('outlook_error')
        const email = urlParams.get('email')

        if (outlookConnected === 'true') {
            setModal({
                title: 'Success!',
                message: `Outlook account ${email ? `(${email})` : ''} connected successfully via OAuth 2.0!`,
                type: 'success',
                showCancel: false,
            })
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname)
            fetchCredentials() // Refresh credentials list
        } else if (outlookError) {
            setModal({
                title: 'Outlook OAuth Error',
                message: `Failed to connect Outlook account: ${decodeURIComponent(outlookError)}`,
                type: 'error',
                showCancel: false,
            })
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname)
        }
    }, [])

    const fetchCredentials = async () => {
        try {
            setLoading(true)
            const response = await api.get<SMTPCredentialsResponse>('/email/smtp')
            if (response.data.success) {
                setCredentials(response.data.credentials || [])
            }
        } catch (error) {
            console.error('Error fetching SMTP credentials:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleProviderTypeSelect = (type: SMTPProvider) => {
        setSelectedProviderType(type)
        setShowForm(true)

        if (type === 'gmail') {
            setFormData({
                provider: 'gmail' as SMTPProvider,
                email: '',
                smtp_host: 'smtp.gmail.com',
                smtp_port: 587,
                smtp_secure: false,
                username: '',
                password: '',
                display_name: '',
            })
        } else if (type === 'outlook') {
            setFormData({
                provider: 'outlook' as SMTPProvider,
                email: '',
                smtp_host: 'smtp-mail.outlook.com',
                smtp_port: 587,
                smtp_secure: false,
                username: '',
                password: '',
                display_name: '',
            })
        } else if (type === 'yahoo') {
            setFormData({
                provider: 'yahoo' as SMTPProvider,
                email: '',
                smtp_host: 'smtp.mail.yahoo.com',
                smtp_port: 587,
                smtp_secure: false,
                username: '',
                password: '',
                display_name: '',
            })
        } else if (type === 'custom') {
            setFormData({
                provider: 'custom' as SMTPProvider,
                email: '',
                smtp_host: '',
                smtp_port: 587,
                smtp_secure: false,
                username: '',
                password: '',
                display_name: '',
            })
        }
        setErrors({})
    }

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}

        if (!formData.email) {
            newErrors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address'
        }
        if (!formData.password) {
            newErrors.password = 'Password is required'
        }
        if (selectedProviderType === 'gmail' && formData.password.replace(/\s+/g, '').length !== 16) {
            newErrors.password = 'Gmail App Password must be 16 characters (without spaces)'
        }
        if (selectedProviderType === 'custom') {
            if (!formData.smtp_host) {
                newErrors.smtp_host = 'SMTP host is required'
            }
            if (!formData.smtp_port) {
                newErrors.smtp_port = 'SMTP port is required'
            }
            if (!formData.username) {
                newErrors.username = 'Username is required'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = async () => {
        if (!validateForm()) {
            return
        }

        // Auto-fill username with email for Gmail and Outlook
        const finalFormData = {
            ...formData,
            username: formData.username || formData.email,
        }

        try {
            setSaving(true)
            const response = await api.post('/email/smtp', finalFormData)

            if (response.data.success) {
                setModal({
                    title: 'Success!',
                    message: 'SMTP credentials saved successfully! Connection verified.',
                    type: 'success',
                    showCancel: false,
                })
                await fetchCredentials()
                setShowForm(false)
                setSelectedProviderType(null)
                setFormData({
                    provider: '',
                    email: '',
                    smtp_host: '',
                    smtp_port: 587,
                    smtp_secure: false,
                    username: '',
                    password: '',
                    display_name: '',
                })
                setErrors({})
            }
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>
            setModal({
                title: 'Error',
                message: axiosError.response?.data?.message || 'Failed to save SMTP credentials',
                type: 'error',
                showCancel: false,
            })
        } finally {
            setSaving(false)
        }
    }

    const handleTestConnection = async (credentialId: number) => {
        try {
            setTesting(true)
            setTestingCredentialId(credentialId)
            const response = await api.post<TestConnectionResponse>(`/email/smtp/${credentialId}/test-connection`)

            setModal({
                title: response.data.success ? 'Connection Successful' : 'Connection Failed',
                message: response.data.message,
                type: response.data.success ? 'success' : 'error',
                showCancel: false,
            })
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>
            setModal({
                title: 'Error',
                message: axiosError.response?.data?.message || 'Failed to test connection',
                type: 'error',
                showCancel: false,
            })
        } finally {
            setTesting(false)
            setTestingCredentialId(null)
        }
    }

    const handleSendTestEmail = async (credentialId: number, event?: React.MouseEvent<HTMLButtonElement>) => {
        // Prevent any event bubbling
        if (event) {
            event.preventDefault()
            event.stopPropagation()
        }

        console.log('🔵 Send Test Email clicked for credential:', credentialId)
        const testEmail = testEmails[credentialId] || ''
        console.log('🔵 Test email value:', testEmail)

        if (!testEmail) {
            setModal({
                title: 'Missing Email',
                message: 'Please enter an email address to send test email',
                type: 'warning',
                showCancel: false,
            })
            return
        }

        try {
            setTesting(true)
            setTestingCredentialId(credentialId)
            console.log('🔵 Sending test email to:', testEmail, 'using credential:', credentialId)
            const response = await api.post<TestEmailResponse>(`/email/smtp/${credentialId}/test-email`, {
                toEmail: testEmail,
            })

            setModal({
                title: response.data.success ? 'Test Email Sent' : 'Failed',
                message: response.data.message,
                type: response.data.success ? 'success' : 'error',
                showCancel: false,
            })
            // Clear only this credential's test email
            setTestEmails(prev => ({ ...prev, [credentialId]: '' }))
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>
            console.error('Error sending test email:', error)
            setModal({
                title: 'Error',
                message: axiosError.response?.data?.message || 'Failed to send test email',
                type: 'error',
                showCancel: false,
            })
        } finally {
            setTesting(false)
            setTestingCredentialId(null)
        }
    }

    const handleDelete = async (credentialId: number) => {
        setModal({
            title: 'Delete SMTP Credentials',
            message: 'Are you sure you want to delete these SMTP credentials?',
            type: 'warning',
            showCancel: true,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: async () => {
                try {
                    await api.delete(`/email/smtp/${credentialId}`)
                    setModal({
                        title: 'Deleted',
                        message: 'SMTP credentials deleted successfully',
                        type: 'success',
                        showCancel: false,
                    })
                    await fetchCredentials()
                } catch (error) {
                    const axiosError = error as AxiosError<{ message?: string }>
                    setModal({
                        title: 'Error',
                        message: axiosError.response?.data?.message || 'Failed to delete credentials',
                        type: 'error',
                        showCancel: false,
                    })
                }
            },
        })
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50/30 px-6 py-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900">Email SMTP Configuration</h2>
                        <p className="text-gray-600 text-sm mt-1">Configure your email account for sending campaigns</p>
                    </div>
                </div>
            </div>

            <div className="p-8">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Existing Credentials */}
                        {credentials.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Configured Email Accounts</h3>
                                {credentials.map((cred) => (
                                    <div key={cred.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="font-semibold text-gray-900">{cred.email}</span>
                                                    {cred.is_verified && (
                                                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded border border-emerald-200">
                                                            Verified
                                                        </span>
                                                    )}
                                                    {cred.is_active ? (
                                                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded border border-emerald-200">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-600 space-y-1">
                                                    <p><span className="font-medium">Provider:</span> {cred.provider}</p>
                                                    <p><span className="font-medium">SMTP:</span> {cred.smtp_host}:{cred.smtp_port}</p>
                                                    {cred.display_name && (
                                                        <p><span className="font-medium">Display Name:</span> {cred.display_name}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleTestConnection(cred.id)}
                                                    disabled={testing && testingCredentialId !== cred.id}
                                                    className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium disabled:opacity-50 border border-purple-200"
                                                >
                                                    {testing && testingCredentialId === cred.id ? 'Testing...' : 'Test'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cred.id)}
                                                    disabled={testing}
                                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50 border border-gray-300"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                        {/* Test Email Input - Separate for each credential */}
                                        <div className="mt-3 flex gap-2">
                                            <input
                                                type="email"
                                                id={`test-email-${cred.id}`}
                                                value={testEmails[cred.id] || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value
                                                    setTestEmails(prev => ({ ...prev, [cred.id]: value }))
                                                }}
                                                placeholder="Enter email to send test"
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <button
                                                type="button"
                                                id={`send-test-btn-${cred.id}`}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    handleSendTestEmail(cred.id, e)
                                                }}
                                                disabled={(testing && testingCredentialId !== cred.id) || !testEmails[cred.id]}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {testing && testingCredentialId === cred.id ? 'Sending...' : 'Send Test'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add New Credentials - Provider Selection */}
                        {!showForm ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Gmail Option */}
                                <button
                                    onClick={() => handleProviderTypeSelect('gmail')}
                                    className="p-6 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors border border-purple-200">
                                            <svg className="w-7 h-7 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900">Gmail</h3>
                                            <p className="text-sm text-gray-600">Google Mail</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-700">
                                        <p className="font-semibold text-red-600">Requirements:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li>2-Factor Authentication must be enabled</li>
                                            <li>App Password required (not regular password)</li>
                                            <li>16-character App Password (without spaces)</li>
                                        </ul>
                                    </div>
                                </button>

                                {/* Outlook Option */}
                                <button
                                    onClick={() => handleProviderTypeSelect('outlook')}
                                    className="p-6 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors border border-purple-200">
                                            <svg className="w-7 h-7 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M7.5 7.5h9v9h-9v-9zM24 4v16c0 1.1-.9 2-2 2H2c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h20c1.1 0 2 .9 2 2zm-2 2H2v12h20V6z" />
                                                <path d="M12 12l-4-4h8l-4 4zm0 0l4 4H8l4-4z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900">Outlook</h3>
                                            <p className="text-sm text-gray-600">Microsoft Email</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-700">
                                        <p className="font-semibold text-green-600">OAuth 2.0 Available:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li>Secure OAuth 2.0 authentication</li>
                                            <li>No App Passwords required</li>
                                            <li>Works with all Outlook accounts</li>
                                        </ul>
                                    </div>
                                </button>

                                {/* Yahoo Option */}
                                <button
                                    onClick={() => handleProviderTypeSelect('yahoo')}
                                    className="p-6 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors border border-purple-200">
                                            <svg className="w-7 h-7 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900">Yahoo</h3>
                                            <p className="text-sm text-gray-600">Yahoo Mail</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-700">
                                        <p className="font-semibold text-purple-600">Requirements:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li>App Password required</li>
                                            <li>Generate from Yahoo Account Security</li>
                                            <li>Works with @yahoo.com, @yahoo.co.uk</li>
                                        </ul>
                                    </div>
                                </button>

                                {/* Custom SMTP Option */}
                                <button
                                    onClick={() => handleProviderTypeSelect('custom')}
                                    className="p-6 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900">Custom SMTP</h3>
                                            <p className="text-sm text-gray-600">Your own SMTP server</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-700">
                                        <p className="font-semibold text-gray-600">Requirements:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li>Enter your SMTP server details</li>
                                            <li>Host, port, username, password</li>
                                            <li>For business email servers</li>
                                        </ul>
                                    </div>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Gmail Configuration Form */}
                                {selectedProviderType === 'gmail' && (
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center border border-purple-200">
                                                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">Gmail Configuration</h3>
                                                <p className="text-sm text-gray-600">Configure your Gmail account</p>
                                            </div>
                                        </div>

                                        {/* Gmail Requirements Info */}
                                        <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-6">
                                            <p className="font-semibold text-red-900 mb-2">Gmail Requirements:</p>
                                            <ol className="list-decimal list-inside space-y-1 text-sm text-red-800">
                                                <li><strong>2-Factor Authentication</strong> must be enabled in your Google Account</li>
                                                <li>You must use an <strong>App Password</strong> (NOT your regular Gmail password)</li>
                                                <li>App Password must be <strong>16 characters</strong> (remove all spaces when entering)</li>
                                                <li>Username must be your <strong>full Gmail address</strong></li>
                                            </ol>
                                        </div>

                                        {/* How to Get Gmail App Password */}
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                                            <p className="font-semibold text-purple-900 mb-2">How to Get Gmail App Password:</p>
                                            <ol className="list-decimal list-inside space-y-1 text-sm text-purple-800">
                                                <li>Go to: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-semibold">myaccount.google.com/apppasswords</a></li>
                                                <li>Select <strong>"Mail"</strong> as the app</li>
                                                <li>Select <strong>"Other (Custom name)"</strong> and enter "Lead Stitch"</li>
                                                <li>Click <strong>"Generate"</strong></li>
                                                <li>Copy the <strong>16-character password</strong> (it will show with spaces like "abcd efgh ijkl mnop")</li>
                                                <li>Paste it below <strong>WITHOUT spaces</strong> (like "abcdefghijklmnop")</li>
                                            </ol>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                    Gmail Address *
                                                </label>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => {
                                                        const email = e.target.value
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            email: email,
                                                            username: email // Auto-fill username with email
                                                        }))
                                                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
                                                    }}
                                                    placeholder="your.email@gmail.com"
                                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                        }`}
                                                />
                                                {errors.email && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                    Gmail App Password * (16 characters, no spaces)
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={formData.password}
                                                        onChange={(e) => {
                                                            // Auto-remove spaces
                                                            const cleaned = e.target.value.replace(/\s+/g, '')
                                                            setFormData(prev => ({ ...prev, password: cleaned }))
                                                            if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
                                                        }}
                                                        placeholder="Enter 16-character App Password (no spaces)"
                                                        maxLength={16}
                                                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 font-mono ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                            }`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        {showPassword ? (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                                {errors.password && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                                )}
                                                <p className="mt-1 text-xs text-gray-600">
                                                    Characters entered: <span className="font-mono font-semibold">{formData.password.length}/16</span>
                                                </p>
                                                <p className="mt-1 text-xs text-orange-600 font-semibold">
                                                    IMPORTANT: Remove all spaces! Gmail shows "abcd efgh ijkl mnop" but enter "abcdefghijklmnop"
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                    Display Name (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.display_name}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                                                    placeholder="Your Name"
                                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={handleSave}
                                                    disabled={saving || formData.password.length !== 16}
                                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {saving ? 'Saving & Verifying...' : 'Save & Verify Gmail'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowForm(false)
                                                        setSelectedProviderType(null)
                                                        setFormData({
                                                            provider: '',
                                                            email: '',
                                                            smtp_host: '',
                                                            smtp_port: 587,
                                                            smtp_secure: false,
                                                            username: '',
                                                            password: '',
                                                            display_name: '',
                                                        })
                                                        setErrors({})
                                                    }}
                                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Outlook Configuration Form */}
                                {selectedProviderType === 'outlook' && (
                                    <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50/30 border border-purple-200 rounded-xl p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center border border-purple-200">
                                                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M7.5 7.5h9v9h-9v-9zM24 4v16c0 1.1-.9 2-2 2H2c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h20c1.1 0 2 .9 2 2zm-2 2H2v12h20V6z" />
                                                    <path d="M12 12l-4-4h8l-4 4zm0 0l4 4H8l4-4z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">Outlook Configuration</h3>
                                                <p className="text-sm text-gray-600">Configure your Microsoft email account</p>
                                            </div>
                                        </div>

                                        {/* Outlook OAuth Option */}
                                        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-6">
                                            <p className="font-semibold text-green-900 mb-2">OAuth 2.0 Authentication</p>
                                            <p className="text-sm text-green-800 mb-4">
                                                Connect your Outlook account securely using OAuth 2.0. This is the recommended and most reliable method for Outlook integration.
                                            </p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const response = await api.get('/email/outlook/oauth/url');
                                                            if (response.data.success) {
                                                                // Open OAuth URL - will create new account or update existing tokens if same account
                                                                window.location.href = response.data.authUrl;
                                                            }
                                                        } catch (error) {
                                                            const axiosError = error as AxiosError<{ message?: string }>
                                                            setModal({
                                                                title: 'Error',
                                                                message: axiosError.response?.data?.message || 'Failed to initiate Outlook OAuth. Please check if OAuth is configured in the backend.',
                                                                type: 'error',
                                                                showCancel: false,
                                                            })
                                                        }
                                                    }}
                                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-600 transition-all"
                                                >
                                                    Connect with Outlook OAuth 2.0
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowForm(false)
                                                        setSelectedProviderType(null)
                                                        setFormData({
                                                            provider: '',
                                                            email: '',
                                                            smtp_host: '',
                                                            smtp_port: 587,
                                                            smtp_secure: false,
                                                            username: '',
                                                            password: '',
                                                            display_name: '',
                                                        })
                                                        setErrors({})
                                                    }}
                                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Yahoo Configuration Form */}
                                {selectedProviderType === 'yahoo' && (
                                    <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50/30 border border-purple-200 rounded-xl p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center border border-purple-200">
                                                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">Yahoo Configuration</h3>
                                                <p className="text-sm text-gray-600">Configure your Yahoo Mail account</p>
                                            </div>
                                        </div>

                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                                            <p className="font-semibold text-purple-900 mb-2">Yahoo Requirements:</p>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-purple-800">
                                                <li>App Password is <strong>required</strong> (Yahoo doesn't allow regular passwords)</li>
                                                <li>Generate App Password from Yahoo Account Security settings</li>
                                                <li>Works with <strong>@yahoo.com</strong>, <strong>@yahoo.co.uk</strong>, etc.</li>
                                            </ul>
                                        </div>

                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                                            <p className="font-semibold text-purple-900 mb-2">How to Get Yahoo App Password:</p>
                                            <ol className="list-decimal list-inside space-y-1 text-sm text-purple-800">
                                                <li>Go to: <a href="https://login.yahoo.com/account/security" target="_blank" rel="noopener noreferrer" className="underline font-semibold">login.yahoo.com/account/security</a></li>
                                                <li>Scroll to <strong>"App passwords"</strong> and click <strong>"Generate app password"</strong></li>
                                                <li>Select <strong>"Mail"</strong> and enter "Lead Stitch"</li>
                                                <li>Copy the generated password and use it below</li>
                                            </ol>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">Yahoo Email Address *</label>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => {
                                                        const email = e.target.value
                                                        setFormData(prev => ({ ...prev, email: email, username: email }))
                                                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
                                                    }}
                                                    placeholder="your.email@yahoo.com"
                                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                                />
                                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">Yahoo App Password *</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={formData.password}
                                                        onChange={(e) => {
                                                            setFormData(prev => ({ ...prev, password: e.target.value }))
                                                            if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
                                                        }}
                                                        placeholder="Enter your Yahoo App Password"
                                                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                                    />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                        {showPassword ? (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                                <p className="mt-1 text-xs text-gray-600">You must use an App Password (not your regular Yahoo password)</p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">Display Name (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={formData.display_name}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                                                    placeholder="Your Name"
                                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={handleSave}
                                                    disabled={saving || !formData.password}
                                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {saving ? 'Saving & Verifying...' : 'Save & Verify Yahoo'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowForm(false)
                                                        setSelectedProviderType(null)
                                                        setFormData({ provider: '', email: '', smtp_host: '', smtp_port: 587, smtp_secure: false, username: '', password: '', display_name: '' })
                                                        setErrors({})
                                                    }}
                                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Custom SMTP Configuration Form */}
                                {selectedProviderType === 'custom' && (
                                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">Custom SMTP Configuration</h3>
                                                <p className="text-sm text-gray-600">Configure your own SMTP server</p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 mb-6">
                                            <p className="font-semibold text-gray-900 mb-2">Custom SMTP Requirements:</p>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                                <li>Enter your SMTP server hostname (e.g., smtp.yourdomain.com)</li>
                                                <li>Common ports: <strong>587</strong> (TLS) or <strong>465</strong> (SSL)</li>
                                                <li>Enter your email address and password</li>
                                                <li>For business email servers (Office 365, Zoho, SendGrid, etc.)</li>
                                            </ul>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">Email Address *</label>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => {
                                                        const email = e.target.value
                                                        setFormData(prev => ({ ...prev, email: email, username: prev.username || email }))
                                                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
                                                    }}
                                                    placeholder="your.email@yourdomain.com"
                                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                                />
                                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-800 mb-2">SMTP Host *</label>
                                                    <input
                                                        type="text"
                                                        value={formData.smtp_host}
                                                        onChange={(e) => {
                                                            setFormData(prev => ({ ...prev, smtp_host: e.target.value }))
                                                            if (errors.smtp_host) setErrors(prev => ({ ...prev, smtp_host: '' }))
                                                        }}
                                                        placeholder="smtp.yourdomain.com"
                                                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.smtp_host ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                                    />
                                                    {errors.smtp_host && <p className="mt-1 text-sm text-red-600">{errors.smtp_host}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-800 mb-2">SMTP Port *</label>
                                                    <input
                                                        type="number"
                                                        value={formData.smtp_port}
                                                        onChange={(e) => {
                                                            setFormData(prev => ({ ...prev, smtp_port: parseInt(e.target.value) || 587 }))
                                                            if (errors.smtp_port) setErrors(prev => ({ ...prev, smtp_port: '' }))
                                                        }}
                                                        placeholder="587 or 465"
                                                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.smtp_port ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                                    />
                                                    {errors.smtp_port && <p className="mt-1 text-sm text-red-600">{errors.smtp_port}</p>}
                                                    <p className="mt-1 text-xs text-gray-600">Usually 587 (TLS) or 465 (SSL)</p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">Username *</label>
                                                <input
                                                    type="text"
                                                    value={formData.username}
                                                    onChange={(e) => {
                                                        setFormData(prev => ({ ...prev, username: e.target.value }))
                                                        if (errors.username) setErrors(prev => ({ ...prev, username: '' }))
                                                    }}
                                                    placeholder="Usually your email address"
                                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.username ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                                />
                                                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">Password *</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={formData.password}
                                                        onChange={(e) => {
                                                            setFormData(prev => ({ ...prev, password: e.target.value }))
                                                            if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
                                                        }}
                                                        placeholder="Enter your SMTP password"
                                                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                                    />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                        {showPassword ? (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">Display Name (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={formData.display_name}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                                                    placeholder="Your Name"
                                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="smtp_secure_custom"
                                                    checked={formData.smtp_secure}
                                                    onChange={(e) => {
                                                        setFormData(prev => ({ ...prev, smtp_secure: e.target.checked, smtp_port: e.target.checked ? 465 : 587 }))
                                                    }}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <label htmlFor="smtp_secure_custom" className="text-sm text-gray-700">Use SSL (Port 465) instead of TLS (Port 587)</label>
                                            </div>

                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={handleSave}
                                                    disabled={saving || !formData.password || !formData.smtp_host}
                                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {saving ? 'Saving & Verifying...' : 'Save & Verify Custom SMTP'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowForm(false)
                                                        setSelectedProviderType(null)
                                                        setFormData({ provider: '', email: '', smtp_host: '', smtp_port: 587, smtp_secure: false, username: '', password: '', display_name: '' })
                                                        setErrors({})
                                                    }}
                                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {modal && (
                <Modal
                    isOpen={true}
                    onClose={() => setModal(null)}
                    title={modal.title}
                    message={modal.message}
                    type={modal.type || 'info'}
                    onConfirm={() => {
                        if (modal.onConfirm) {
                            modal.onConfirm()
                        }
                        setModal(null)
                    }}
                    onCancel={() => {
                        if (modal.onCancel) {
                            modal.onCancel()
                        }
                        setModal(null)
                    }}
                    confirmText={modal.confirmText || 'OK'}
                    cancelText={modal.cancelText || 'Cancel'}
                    showCancel={modal.showCancel || false}
                />
            )}
        </div>
    )
}

export default EmailSMTPConfig
