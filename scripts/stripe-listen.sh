#!/bin/bash
# Stripe CLI Webhook Listener
# Forwards Stripe webhook events to local development server

# Default port (can be overridden)
PORT=${PORT:-3000}

echo "🔔 Starting Stripe webhook listener..."
echo "📡 Forwarding to: http://localhost:${PORT}/api/stripe/webhook"
echo ""
echo "⚠️  Make sure your local dev server is running:"
echo "   cd apps/web && pnpm dev"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Error: Stripe CLI is not installed"
    echo ""
    echo "Install it with:"
    echo "  brew install stripe/stripe-cli/stripe"
    echo ""
    echo "Or visit: https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Check if port is in use
if lsof -Pi :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ Port ${PORT} is in use (dev server likely running)"
else
    echo "⚠️  Warning: Port ${PORT} is not in use"
    echo "   Make sure your dev server is running first!"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Start Stripe listener
stripe listen --forward-to localhost:${PORT}/api/stripe/webhook

