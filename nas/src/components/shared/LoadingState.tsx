import { LoadingSpinner } from "./LoadingSpinner"

interface LoadingStateProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingState({ 
  message = "Loading...", 
  fullScreen = false 
}: LoadingStateProps) {
  if (fullScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">{message}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner size="md" />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
