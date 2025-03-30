import { nanumSquareNeo } from './utils/fonts'
import "./globals.css";
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'aisle',
  description: 'aisle website',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={nanumSquareNeo.variable}>
      <body className={`${nanumSquareNeo.variable} antialiased`}>
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
