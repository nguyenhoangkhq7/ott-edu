import SectionTitle from "@/shared/components/ui/SectionTitle";

type AuthHeaderProps = {
  title: string;
  description: string;
};

export default function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <div className="mb-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-50 bg-gradient-to-tr from-indigo-100 to-indigo-50 shadow-sm">
        <svg className="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0-6l-9 5-9-5 9-5 9 5z" />
        </svg>
      </div>
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-indigo-500">OTT Edu</p>
      <SectionTitle title={title} showToggle={false} />
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}
