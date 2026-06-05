import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'РЖД — Личный кабинет пассажира',
  description: 'Покупайте билеты на поезда, отслеживайте бронирования и управляйте поездками в личном кабинете пассажира РЖД.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${GeistSans.variable} antialiased`}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
