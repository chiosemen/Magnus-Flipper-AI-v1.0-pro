export default function UpgradeCancelPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="text-8xl mb-6">❌</div>
          <h1 className="text-5xl font-bold mb-4">Upgrade Canceled</h1>
          <p className="text-[#a0a0a0] text-lg">
            Your subscription upgrade was not completed
          </p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-8">
          <div className="text-yellow-400 mb-2">
            <strong>No Charges Were Made</strong>
          </div>
          <div className="text-[#a0a0a0] text-sm">
            Your payment was canceled and you have not been charged.
          </div>
        </div>

        <div className="space-y-4">
          <a
            href="/upgrade"
            className="block bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            Try Again
          </a>
          <a
            href="/free"
            className="block text-[#a0a0a0] hover:text-[#ededed] transition-colors"
          >
            Back to Dashboard
          </a>
        </div>

        <div className="mt-12 text-sm text-[#666]">
          <p>Need help? Contact support@magnusflipper.ai</p>
        </div>
      </div>
    </div>
  );
}
