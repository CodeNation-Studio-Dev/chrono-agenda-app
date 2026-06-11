export interface ClipCheckoutInput {
  amount: number
  currency?: string
  description: string
  reference: string
  customerEmail?: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string | number | boolean | null>
}

export interface ClipCheckoutResult {
  checkoutUrl: string
  providerPaymentId: string | null
  raw: unknown
}

export interface ClipRecurringChargeInput {
  amount: number
  currency?: string
  description: string
  reference: string
  customerId: string
  paymentMethodToken: string
  idempotencyKey: string
  metadata?: Record<string, string | number | boolean | null>
}

export interface ClipRecurringChargeResult {
  providerPaymentId: string | null
  status: string
  succeeded: boolean
  raw: unknown
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export async function createClipCheckout(input: ClipCheckoutInput): Promise<ClipCheckoutResult> {
  const secretKey = requireEnv('CLIP_SECRET_KEY')
  const createPaymentUrl = requireEnv('CLIP_CREATE_PAYMENT_URL')

  const response = await fetch(createPaymentUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency ?? 'MXN',
      description: input.description,
      reference: input.reference,
      customer: input.customerEmail ? { email: input.customerEmail } : undefined,
      redirect_urls: {
        success: input.successUrl,
        cancel: input.cancelUrl,
      },
      metadata: input.metadata,
    }),
  })

  const raw = await response.json().catch(() => null)

  if (!response.ok) {
    const errorText = typeof raw === 'object' && raw !== null ? JSON.stringify(raw) : String(raw)
    throw new Error(`Clip checkout creation failed (${response.status}): ${errorText}`)
  }

  const parsed = raw as Record<string, unknown> | null
  const checkoutUrl =
    (parsed?.checkout_url as string | undefined)
    ?? (parsed?.payment_url as string | undefined)
    ?? (parsed?.redirect_url as string | undefined)
    ?? ((parsed?.data as Record<string, unknown> | undefined)?.checkout_url as string | undefined)
    ?? ((parsed?.data as Record<string, unknown> | undefined)?.payment_url as string | undefined)

  if (!checkoutUrl) {
    throw new Error('Clip response did not include a checkout URL')
  }

  const providerPaymentId =
    (parsed?.id as string | undefined)
    ?? (parsed?.payment_id as string | undefined)
    ?? ((parsed?.data as Record<string, unknown> | undefined)?.id as string | undefined)
    ?? null

  return {
    checkoutUrl,
    providerPaymentId,
    raw,
  }
}

export async function createClipRecurringCharge(input: ClipRecurringChargeInput): Promise<ClipRecurringChargeResult> {
  const secretKey = requireEnv('CLIP_SECRET_KEY')
  const recurringChargeUrl = requireEnv('CLIP_RECURRING_CHARGE_URL')

  const response = await fetch(recurringChargeUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': input.idempotencyKey,
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency ?? 'MXN',
      description: input.description,
      reference: input.reference,
      customer_id: input.customerId,
      payment_method_token: input.paymentMethodToken,
      metadata: input.metadata,
    }),
  })

  const raw = await response.json().catch(() => null)

  if (!response.ok) {
    const errorText = typeof raw === 'object' && raw !== null ? JSON.stringify(raw) : String(raw)
    throw new Error(`Clip recurring charge failed (${response.status}): ${errorText}`)
  }

  const parsed = raw as Record<string, unknown> | null
  const status = (
    (parsed?.status as string | undefined)
    ?? ((parsed?.data as Record<string, unknown> | undefined)?.status as string | undefined)
    ?? 'unknown'
  ).toLowerCase()

  const providerPaymentId =
    (parsed?.id as string | undefined)
    ?? (parsed?.payment_id as string | undefined)
    ?? ((parsed?.data as Record<string, unknown> | undefined)?.id as string | undefined)
    ?? null

  return {
    providerPaymentId,
    status,
    succeeded: ['paid', 'approved', 'succeeded', 'completed'].includes(status),
    raw,
  }
}
