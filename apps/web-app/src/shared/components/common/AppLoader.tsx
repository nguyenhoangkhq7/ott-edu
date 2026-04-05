export default function AppLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <video
        src="/assets/loading.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="w-[320px] h-[320px] md:w-[480px] md:h-[480px] object-contain"
      />
    </div>
  );
}
