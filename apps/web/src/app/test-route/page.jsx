export default function TestRoute() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">Test Route Works!</h1>
        <p className="text-neutral-600">If you can see this, routing is working.</p>
        <a 
          href="/customers" 
          className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Go to Customers
        </a>
      </div>
    </div>
  );
}
