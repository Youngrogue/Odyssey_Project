import { actionHandler } from "../../../../lib/email/handlers";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return actionHandler(request, "resend");
}
