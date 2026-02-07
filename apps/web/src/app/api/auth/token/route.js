import { getToken } from "@auth/core/jwt";

export async function GET(request) {
  try {
    const [token, jwt] = await Promise.all([
      getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        secureCookie: process.env.AUTH_URL?.startsWith("https") ?? false,
        raw: true,
      }),
      getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        secureCookie: process.env.AUTH_URL?.startsWith("https") ?? false,
      }),
    ]);

    if (!jwt) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(
      JSON.stringify({
        jwt: token,
        user: {
          id: jwt.sub,
          email: jwt.email,
          name: jwt.name,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error in /api/auth/token:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
