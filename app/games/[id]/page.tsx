import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getGameState } from "@/lib/games";
import { GameRoom } from "@/components/game/game-room";

export default function GamePage({ params }: PageProps<"/games/[id]">) {
  return (
    <Suspense fallback={<RoomSkeleton />}>
      <Room params={params} />
    </Suspense>
  );
}

async function Room({ params }: { params: PageProps<"/games/[id]">["params"] }) {
  const { id } = await params;
  const user = await requireUser();
  const state = await getGameState(id, user.id);
  if (!state) notFound();
  return <GameRoom initialState={state} />;
}

function RoomSkeleton() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="animate-pulse-slow space-y-5">
        <div className="h-28 rounded-2xl bg-surface-2" />
        <div className="h-56 rounded-2xl bg-surface-2" />
      </div>
    </div>
  );
}
