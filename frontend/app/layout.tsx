import './globals.css';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>HugoAFK - Modern Minecraft AFK Client Dashboard</title>
        <meta name="description" content="Modern web dashboard and server management panel for Minecraft AFK clients and bots." />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const origError = console.error;
                console.error = function(...args) {
                  if (args[0] && typeof args[0] === 'string' && (args[0].includes('bis_skin_checked') || args[0].includes('hydration') || args[0].includes('Hydration'))) {
                    return;
                  }
                  origError.apply(console, args);
                };
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
