import { authService, signToken } from './authService.js';

export function isDiscordConfigured(): boolean {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  return Boolean(clientId && clientSecret && clientId !== 'YOUR_DISCORD_CLIENT_ID');
}

export function getDiscordAuthUrl(serverOrigin: string): string {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = `${serverOrigin}/api/auth/discord/callback`;
  return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=identify%20email`;
}

export async function handleDiscordCallback(code: string, serverOrigin: string): Promise<string> {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = `${serverOrigin}/api/auth/discord/callback`;

  // Exchange code for access token
  const body = new URLSearchParams({
    client_id: clientId!,
    client_secret: clientSecret!,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    const errData = await tokenRes.text();
    throw new Error(`Discord token exchange failed: ${errData}`);
  }

  const tokenData = (await tokenRes.json()) as { access_token: string };

  // Fetch Discord user profile
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error('Failed to fetch Discord user identity');
  }

  const discordUser = (await userRes.json()) as {
    id: string;
    username: string;
    email?: string;
  };

  const email = discordUser.email || `${discordUser.username}@discord.local`;
  const user = authService.findOrCreateOAuthUser('discord', discordUser.id, email, discordUser.username);

  return signToken(user);
}
