import { type ReactNode } from "react";

type AuthPageContainerProps = {
  children: ReactNode;
};

export default function AuthPageContainer({ children }: AuthPageContainerProps) {
  return <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">{children}</div>;
}
