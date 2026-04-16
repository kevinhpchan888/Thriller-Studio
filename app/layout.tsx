import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Thriller Studio',
  description: 'Turn non-fiction topics into cinematic YouTube thriller screenplays',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-surface antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
