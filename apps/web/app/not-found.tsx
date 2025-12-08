export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
        <p className="text-sm text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
    </div>
  );
}
