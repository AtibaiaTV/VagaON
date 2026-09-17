import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Chat from "@/components/match/Chat";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Conversa — VagaON",
};

export default async function ConversaPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/entrar");
  const { role } = session.user;
  if (role === "admin") redirect("/painel");

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />
      <Chat matchId={params.id} lado={role} />
    </div>
  );
}
