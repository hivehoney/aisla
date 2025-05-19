import { nanumSquareNeo } from './utils/fonts'
import "./globals.css";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SessionProvider } from 'next-auth/react';
import { NicknameSetupProvider } from '@/components/nickname-setup/nickname-setup-provider';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from "@/components/theme-provider"
import { StoreProvider } from '@/contexts/store-context';
import { headers } from 'next/headers';

export const metadata = {
  title: 'aisla',
  description: 'aisla website',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${nanumSquareNeo.variable} antialiased`}>
        <SessionProvider>
          <ThemeProvider>
            <StoreProvider>
              <NicknameSetupProvider>
                <Header />
                  <main className="flex-1">{children}</main>
                <Footer />
                <Toaster />
              </NicknameSetupProvider>
            </StoreProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
