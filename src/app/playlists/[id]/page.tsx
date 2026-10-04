import { PlaylistDetail } from "@/components/playlist/PlaylistDetail";

function decodeId(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PlaylistDetail id={decodeId(id)} />;
}
