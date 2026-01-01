import { useSelector } from 'react-redux'
import { useAppSelector } from '../store/hooks'

function GlobalLoading() {
  const { globalLoading } = useAppSelector((state) => state.loading)

  if (!globalLoading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-blue-200">
        <div className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 animate-progress"></div>
      </div>
    </div>
  )
}

export default GlobalLoading

