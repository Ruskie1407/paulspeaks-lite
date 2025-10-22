import './globals.css';

export const metadata = {
  title: 'PaulSpeaks Agent',
  description: 'PaulSpeaks dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{margin:0, background:'#0b1220', color:'#fff', fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'}}>
        {children}
      </body>
    </html>
  );
}
