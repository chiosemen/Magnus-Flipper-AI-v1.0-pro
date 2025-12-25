'use client'

export async function startCheckout(priceId: string) {
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })

    if (!res.ok) {
      throw new Error('Checkout unavailable')
    }

    const json = await res.json()

    if (json?.checkout_url) {
      window.location.href = json.checkout_url
      return
    }

    throw new Error('Missing checkout URL')
  } catch {
    alert('Checkout is coming online. Please check back shortly.')
  }
}
