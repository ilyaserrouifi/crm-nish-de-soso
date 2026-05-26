export async function sendVerificationOtpEmail(params: { to: string; otp: string }) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM

  if (!apiKey || !from) {
    console.warn('Resend skipped: RESEND_API_KEY or EMAIL_FROM is missing')
    return { sent: false as const, reason: 'missing_env' as const }
  }

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6">
      <h2>Vérifiez votre compte</h2>
      <p>Votre code OTP est :</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:4px">${params.otp}</p>
      <p>Ce code expire dans 15 minutes.</p>
    </div>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: 'Vérifiez votre compte',
      html,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Resend API failed (${response.status}): ${text}`)
  }

  return { sent: true as const }
}
