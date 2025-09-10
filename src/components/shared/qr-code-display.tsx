import Image from 'next/image';

export function QRCodeDisplay({ url }: { url: string }) {
  if (!url) return null;

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(url)}`;

  return (
    <div className="flex justify-center items-center p-4 bg-white rounded-lg">
      <Image
        src={qrApiUrl}
        alt="Batch QR Code"
        width={256}
        height={256}
        unoptimized // Necessary for external image URLs that are not configured in next.config.js
      />
    </div>
  );
}
