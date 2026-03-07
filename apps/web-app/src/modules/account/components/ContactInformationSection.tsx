interface ContactInformationSectionProps {
  email: string;
  phoneNumber: string;
  onChangeEmail: () => void;
  onEditPhone: () => void;
}

export default function ContactInformationSection({
  email,
  phoneNumber,
  onChangeEmail,
  onEditPhone,
}: ContactInformationSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Contact Information</h2>
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Email address</p>
            <p className="mt-1 text-sm text-slate-900">{email}</p>
          </div>
          <button
            onClick={onChangeEmail}
            className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            Change
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Phone number</p>
            <p className="mt-1 text-sm text-slate-900">{phoneNumber}</p>
          </div>
          <button
            onClick={onEditPhone}
            className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            Edit
          </button>
        </div>
      </div>
    </section>
  );
}
