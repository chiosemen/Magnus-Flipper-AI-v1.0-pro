"use client";

import { motion } from "framer-motion";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-black text-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-900/50 p-10 rounded-2xl border border-neutral-700 backdrop-blur-xl"
      >
        <h1 className="text-4xl font-bold mb-2">Create your account</h1>
        <p className="text-neutral-400 mb-8">
          Start flipping with real-time AI power.
        </p>
        <form className="flex flex-col gap-5">
          <input
            type="email"
            placeholder="Email"
            className="bg-black border border-neutral-700 p-4 rounded-xl"
          />
          <input
            type="password"
            placeholder="Password"
            className="bg-black border border-neutral-700 p-4 rounded-xl"
          />
          <button className="bg-white text-black py-4 rounded-xl font-semibold hover:bg-neutral-200 transition">
            Create Account
          </button>
        </form>
        <p className="text-neutral-400 mt-8 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-white font-semibold hover:underline">
            Sign in
          </a>
        </p>
      </motion.div>
    </div>
  );
}

