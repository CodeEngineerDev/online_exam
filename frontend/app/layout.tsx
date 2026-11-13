import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ExamPoint | Examination Workspace',
  description: 'Manage students, examinations, questions, submissions and results.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
