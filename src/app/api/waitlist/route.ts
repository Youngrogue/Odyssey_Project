import { after } from "next/server";
import { signupHandler } from "../../../lib/waitlist/signup-handler";
export const runtime = "nodejs";
export function POST(request: Request) {
  return signupHandler(request, after);
}
