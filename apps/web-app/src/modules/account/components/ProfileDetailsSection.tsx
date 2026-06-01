import Image from "next/image";

interface ProfileDetailsSectionProps {
  avatarUrl: string;
  fullName: string;
  onEdit: () => void;
}

export default function ProfileDetailsSection({
  avatarUrl,
  fullName,
  onEdit,
}: ProfileDetailsSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Profile details</h2>
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full">
            <Image
              src={avatarUrl}
              alt={fullName}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Full Name</p>
            <p className="mt-1 text-base font-medium text-slate-900">{fullName}</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="rounded-md px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
        >
          Edit
        </button>
      </div>
    </section>
  );
}
