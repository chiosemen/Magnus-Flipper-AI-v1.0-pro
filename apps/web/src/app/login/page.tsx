export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Magnus Flipper AI</h1>
          <p className="text-[#a0a0a0]">Sign in to your account</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#ededed] placeholder-[#666] focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#ededed] placeholder-[#666] focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors mb-4">
            Sign In
          </button>

          <div className="text-center text-sm text-[#a0a0a0]">
            Don't have an account?{" "}
            <a href="/signup" className="text-blue-500 hover:text-blue-400">
              Sign up
            </a>
          </div>
        </div>

        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="text-sm text-yellow-500">
            <strong>Dev Mode:</strong> Authentication is mocked. Go to{" "}
            <a href="/dev/tier" className="underline">
              /dev/tier
            </a>{" "}
            to set your tier.
          </div>
        </div>
      </div>
    </div>
  );
}
