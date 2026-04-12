import { ReactNode } from 'react';

export const metadata = {
  title: 'Assignments | Learning Management System',
  description: 'Complete your assignments and quizzes',
};

export default function AssignmentsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
