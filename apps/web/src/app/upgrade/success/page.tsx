export default function UpgradeSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="text-8xl mb-6">🎉</div>
          <h1 className="text-5xl font-bold mb-4">Subscription Activated!</h1>
          <p className="text-[#a0a0a0] text-lg">
            Your upgrade has been processed successfully
          </p>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-8">
          <div className="text-green-400 mb-2">
            <strong>What's Next?</strong>
          </div>
          <div className="text-[#a0a0a0] text-sm">
            Your new features are now active. You'll receive a confirmation email shortly.
          </div>
        </div>

        <div className="space-y-4">
          <a
            href="/pro"
            className="block bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            Go to Dashboard
          </a>
          <a
            href="/upgrade"
            className="block text-[#a0a0a0] hover:text-[#ededed] transition-colors"
          >
            Manage Subscription
          </a>
        </div>

        <div className="mt-12 text-sm text-[#666]">
          <p>Questions? Contact support@magnusflipper.ai</p>
        </div>
      </div>
    </div>
  );
}
