import Image from "next/image";
import SectionTitle from "@/shared/components/ui/SectionTitle";

type AuthHeaderProps = {
  title: string;
  description: string;
};

export default function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <div className="mb-9 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-slate-50 to-indigo-50 shadow-[0_16px_45px_-24px_rgba(79,70,229,0.45)]">
        <Image
          src="/assets/logo.png"
          alt="OTT Edu Logo"
          width={52}
          height={52}
          className="h-13 w-13 object-contain"
          priority
        />
      </div>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-indigo-600">OTT Edu</p>
      <div className="mx-auto mb-3 h-px w-20 bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />
      <SectionTitle title={title} showToggle={false} />
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
