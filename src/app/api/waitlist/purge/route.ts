import { operatorHandler } from "../../../../lib/email/handlers";
export const runtime = "nodejs";
export async function GET(request: Request) {
  return operatorHandler(request, "purge");
}
export const POST = GET;
