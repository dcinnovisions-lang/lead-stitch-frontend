import { useState, useEffect, useRef } from 'react'
import { useAppSelector } from '../store/hooks'

function Header() {
  const { user } = useAppSelector((state) => state.auth)
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY

          if (currentScrollY < lastScrollY.current || currentScrollY < 10) {
            setIsVisible(true)
          } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
            setIsVisible(false)
          }

          lastScrollY.current = currentScrollY
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header 
      className={`bg-gradient-to-r from-white via-blue-50/50 to-white backdrop-blur-sm sticky top-0 z-40 shadow-sm transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="ml-64 px-6 py-4 flex items-center justify-between">
        <div className="flex-1"></div>
        <div className="flex items-center gap-4">
          <button className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <button className="relative p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-400 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
              <span className="text-white font-semibold text-sm">
                {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-900">
                {user?.firstName || (user?.role === 'admin' ? 'Admin' : 'User')}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email?.split('@')[0]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

