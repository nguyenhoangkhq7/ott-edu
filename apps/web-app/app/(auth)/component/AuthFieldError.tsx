type AuthFieldErrorProps = {
  message?: string;
};

export default function AuthFieldError({ message }: AuthFieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-rose-500">
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </p>
  );
}
