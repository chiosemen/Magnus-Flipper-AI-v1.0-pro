"use client";

import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-neutral-900 text-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-800/50 backdrop-blur-xl p-10 rounded-2xl border border-neutral-700"
      >
        <h1 className="text-4xl font-bold mb-2">Welcome back</h1>
        <p className="text-neutral-400 mb-8">Sign in to your Magnus account</p>
        <form className="flex flex-col gap-5">
          <input
            type="email"
            placeholder="Email address"
            className="bg-neutral-900 border border-neutral-700 p-4 rounded-xl text-white"
          />
          <input
            type="password"
            placeholder="Password"
            className="bg-neutral-900 border border-neutral-700 p-4 rounded-xl text-white"
          />
          <button className="bg-white text-black py-4 rounded-xl font-semibold hover:bg-neutral-200 transition">
            Sign In
          </button>
        </form>
        <p className="text-neutral-400 mt-8 text-center">
          Don't have an account?{" "}
          <a
            href="/register"
            className="text-white font-semibold hover:underline"
          >
            Create one
          </a>
        </p>
      </motion.div>
    </div>
  );
}

