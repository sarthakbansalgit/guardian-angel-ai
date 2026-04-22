import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureSession } from "@/lib/ensure-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "Emergency Contacts — SafeHer" }, { name: "description", content: "Manage trusted emergency contacts." }] }),
  component: Contacts,
});

interface Contact { id: string; name: string; phone: string; relationship: string | null; }

function Contacts() {
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rel, setRel] = useState("");

  const load = async () => {
    const uid = await ensureSession();
    if (!uid) { toast.error("Session unavailable."); setLoading(false); return; }
    const { data, error } = await supabase.from("emergency_contacts").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Contact[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = await ensureSession();
    if (!uid) { toast.error("Session unavailable."); return; }
    const { error } = await supabase.from("emergency_contacts").insert({
      user_id: uid, name, phone, relationship: rel || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Contact added"); setName(""); setPhone(""); setRel(""); load(); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removed"); load(); }
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl font-bold">Emergency Contacts</h1>
      <p className="mt-1 text-sm text-muted-foreground">These trusted people are notified when you trigger SOS.</p>

      <form onSubmit={add} className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} /></div>
        <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={20} /></div>
        <div><Label>Relationship</Label><Input value={rel} onChange={(e) => setRel(e.target.value)} placeholder="e.g. Sister" maxLength={40} /></div>
        <Button type="submit" className="self-end bg-primary hover:bg-primary/90"><UserPlus className="h-4 w-4 mr-1" />Add</Button>
      </form>

      <div className="mt-8 space-y-3">
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> :
          items.length === 0 ? <p className="text-sm text-muted-foreground">No contacts yet.</p> :
          items.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <div className="font-semibold">{c.name} <span className="text-xs text-muted-foreground ml-1">{c.relationship}</span></div>
                <div className="text-sm text-muted-foreground">{c.phone}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
      </div>
    </main>
  );
}
