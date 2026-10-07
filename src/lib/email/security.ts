import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
export function digest(secret: string, purpose: string, value: string) {
  return createHmac("sha256", secret)
    .update(`${purpose}\0${value}`)
    .digest("hex");
}
export function token() {
  return randomBytes(32).toString("base64url");
}
export function seal(value: unknown, secret: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv(
      "aes-256-gcm",
      createHash("sha256").update(`mail-encryption\0${secret}`).digest(),
      iv,
    );
  const data = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}
export function unseal<T>(value: string, secret: string): T {
  const data = Buffer.from(value, "base64url"),
    cipher = createDecipheriv(
      "aes-256-gcm",
      createHash("sha256").update(`mail-encryption\0${secret}`).digest(),
      data.subarray(0, 12),
    );
  cipher.setAuthTag(data.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([cipher.update(data.subarray(28)), cipher.final()]).toString(
      "utf8",
    ),
  ) as T;
}
export function verifyWebhook(
  body: string,
  headers: Headers,
  secret: string,
  now = Date.now(),
) {
  const id = headers.get("svix-id"),
    time = headers.get("svix-timestamp"),
    signatures = headers.get("svix-signature");
  if (
    !id ||
    id.length > 200 ||
    !time ||
    !/^\d+$/.test(time) ||
    Math.abs(now / 1000 - Number(time)) > 300 ||
    !signatures
  )
    return false;
  const expected = createHmac(
    "sha256",
    Buffer.from(secret.replace(/^whsec_/, ""), "base64"),
  )
    .update(`${id}.${time}.${body}`)
    .digest();
  return signatures.split(" ").some((s) => {
    const [version, sig] = s.split(",");
    if (version !== "v1" || !sig) return false;
    const got = Buffer.from(sig, "base64");
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}
