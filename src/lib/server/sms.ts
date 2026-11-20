import "server-only";

/** SMS OTP via MSG91 (set MSG91_AUTH_KEY + MSG91_OTP_TEMPLATE_ID). */
export const smsConfigured = () => Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_OTP_TEMPLATE_ID);

export async function sendOtpSms(phone: string, code: string): Promise<{ ok: boolean; error?: string }> {
  if (!smsConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[sms:dev] OTP for ${phone}: ${code}`);
      return { ok: true };
    }
    return { ok: false, error: "SMS is not configured" };
  }
  const mobile = phone.replace(/^\+/, "");
  try {
    const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(process.env.MSG91_OTP_TEMPLATE_ID!)}&mobile=${mobile}&otp=${code}`;
    const res = await fetch(url, { method: "POST", headers: { authkey: process.env.MSG91_AUTH_KEY!, "Content-Type": "application/json" }, body: "{}", signal: AbortSignal.timeout(10000) });
    const j = (await res.json().catch(() => ({}))) as { type?: string; message?: string };
    return res.ok && j.type !== "error" ? { ok: true } : { ok: false, error: j.message || `MSG91 ${res.status}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
