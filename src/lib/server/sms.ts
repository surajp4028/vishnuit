import "server-only";

/**
 * SMS OTP. Uses Fast2SMS (FAST2SMS + DLT sender/template) when set, otherwise MSG91 (MSG91_AUTH_KEY + MSG91_OTP_TEMPLATE_ID).
 * In development without a provider the code is printed to the server log.
 */
const fast2sms = () => Boolean(process.env.FAST2SMS);
const msg91 = () => Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_OTP_TEMPLATE_ID);
export const smsConfigured = () => fast2sms() || msg91();

export async function sendOtpSms(phone: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const ten = phone.replace(/^\+91/, "");
  if (fast2sms()) {
    const e = process.env;
    const dlt = (e.FAST2SMS_ROUTE || "dlt") === "dlt" && e.FAST2SMS_SENDER_ID && e.FAST2SMS_TEMPLATE_ID;
    const payload = dlt
      ? { route: "dlt", sender_id: e.FAST2SMS_SENDER_ID, message: e.FAST2SMS_TEMPLATE_ID, variables_values: code, numbers: ten }
      : { route: "otp", variables_values: code, numbers: ten };
    try {
      const res = await fetch(e.FAST_SMS_URL || "https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: { authorization: e.FAST2SMS!, "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      const j = (await res.json().catch(() => ({}))) as { return?: boolean; message?: string | string[] };
      if (j.return) return { ok: true };
      return { ok: false, error: `Fast2SMS ${res.status}: ${Array.isArray(j.message) ? j.message.join(" ") : j.message ?? ""}`.slice(0, 200) };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }
  if (msg91()) {
    try {
      const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(process.env.MSG91_OTP_TEMPLATE_ID!)}&mobile=${phone.replace(/^\+/, "")}&otp=${code}`;
      const res = await fetch(url, { method: "POST", headers: { authkey: process.env.MSG91_AUTH_KEY!, "Content-Type": "application/json" }, body: "{}", signal: AbortSignal.timeout(10000) });
      const j = (await res.json().catch(() => ({}))) as { type?: string; message?: string };
      return res.ok && j.type !== "error" ? { ok: true } : { ok: false, error: j.message || `MSG91 ${res.status}` };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }
  if (process.env.NODE_ENV !== "production") {
    console.log(`[sms:dev] OTP for ${phone}: ${code}`);
    return { ok: true };
  }
  return { ok: false, error: "SMS is not configured" };
}
