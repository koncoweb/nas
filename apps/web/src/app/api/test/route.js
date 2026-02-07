export async function GET() {
  try {
    return Response.json({ 
      success: true, 
      message: 'API route is working!',
      timestamp: new Date().toISOString(),
      database_url: process.env.DATABASE_URL ? 'Connected' : 'Not configured'
    });
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}