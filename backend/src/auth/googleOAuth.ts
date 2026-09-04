import { authService, signToken } from './authService.js';

export function isGoogleConfigured(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return Boolean(clientId && clientSecret && clientId !== 'YOUR_GOOGLE_CLIENT_ID');
}

export function getGoogleAuthUrl(serverOrigin: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${serverOrigin}/api/auth/google/callback`;
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account`;
}

export async function handleGoogleCallback(code: string, serverOrigin: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${serverOrigin}/api/auth/google/callback`;

  // Exchange authorization code for tokens
  const body = new URLSearchParams({
    code,
    client_id: clientId!,
    client_secret: clientSecret!,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    const errData = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${errData}`);
  }

  const tokenData = (await tokenRes.json()) as { access_token: string };

  // Fetch Google user profile
  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error('Failed to fetch Google user profile');
  }

  const googleUser = (await userRes.json()) as {
    sub: string;
    email: string;
    name?: string;
  };

  const username = (googleUser.name || googleUser.email.split('@')[0]).replace(/\s+/g, '_');
  const user = authService.findOrCreateOAuthUser('google', googleUser.sub, googleUser.email, username);

  return signToken(user);
}
