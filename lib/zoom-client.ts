import axios from "axios";

/**
 * Feature flag: Allow app to function without Zoom in development
 * Appointments will be created but without Zoom meeting links
 */
export const ZOOM_ENABLED = !!(
  process.env.ZOOM_ACCOUNT_ID &&
  process.env.ZOOM_CLIENT_ID &&
  process.env.ZOOM_CLIENT_SECRET &&
  process.env.ZOOM_ACCOUNT_ID !== "__PLACEHOLDER__"
);

interface ZoomAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get Zoom OAuth access token
 * Caches token until expiration
 */
async function getZoomAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  const accountId = process.env.ZOOM_ACCOUNT_ID!;
  const clientId = process.env.ZOOM_CLIENT_ID!;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET!;

  try {
    const response = await axios.post<ZoomAccessToken>(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
      {},
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
      }
    );

    const { access_token, expires_in } = response.data;

    // Cache token (expires in ~1 hour, we cache for slightly less)
    cachedToken = {
      token: access_token,
      expiresAt: Date.now() + expires_in * 1000 - 60000, // Subtract 1 min buffer
    };

    console.log("✅ Zoom access token obtained");
    return access_token;
  } catch (error) {
    console.error("Failed to get Zoom access token:", error);
    throw new Error("Failed to authenticate with Zoom");
  }
}

/**
 * Get Zoom API client with authentication
 */
export async function getZoomClient() {
  if (!ZOOM_ENABLED) {
    console.warn("⚠️  Zoom is not configured. Set ZOOM credentials in .env to enable meetings.");
    return null;
  }

  try {
    const token = await getZoomAccessToken();

    return axios.create({
      baseURL: "https://api.zoom.us/v2",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Failed to initialize Zoom client:", error);
    return null;
  }
}

/**
 * Check if Zoom is properly configured
 */
export function isZoomConfigured(): boolean {
  return ZOOM_ENABLED;
}
