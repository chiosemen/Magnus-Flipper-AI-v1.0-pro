#!/usr/bin/env bash
set -e

echo "🌐 Linking project..."
vercel link --yes --project magnus-web --org chiosemen

echo "🔐 Pushing env vars..."
vercel env pull .env.production --yes

echo "🚀 Deploying to production..."
vercel deploy --prod --yes --token $VERCEL_TOKEN
