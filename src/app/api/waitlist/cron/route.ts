import { operatorHandler } from "../../../../lib/email/handlers";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  return operatorHandler(request, "drain");
}
