interface VideoBackdropProps {
  src: string;
}

export default function VideoBackdrop({ src }: VideoBackdropProps) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <video className="w-full h-full object-cover" src={src} autoPlay loop muted playsInline />
      <div className="absolute inset-0 bg-[#F8EFDD]/55" />
    </div>
  );
}
