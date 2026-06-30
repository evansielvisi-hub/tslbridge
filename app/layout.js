import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'TSLBridge',
  description: 'AI Tanzanian Sign Language Communication',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}