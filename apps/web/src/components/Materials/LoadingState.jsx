export function LoadingState() {
  return (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <p className="text-neutral-600">Loading materials...</p>
    </div>
  );
}
