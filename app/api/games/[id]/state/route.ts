import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dal";
import { getGameState } from "@/lib/games";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/games/[id]/state">,
) {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const state = await getGameState(id, user.id);
  if (!state) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json(state, {
    headers: { "Cache-Control": "no-store" },
  });
}
