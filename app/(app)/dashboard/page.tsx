"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Plus } from "lucide-react";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { CreateLeadModal } from "@/components/leads/CreateLeadModal";
import { Button } from "@/components/ui/Button";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  CLOSER: "Closer",
  SETTER: "Trainee",
  SETTER_JR: "Setter",
  PARTNER: "Partner",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const role = session?.user?.role || "";
  const isAdmin = role === "ADMIN";
  const isSetter = role === "SETTER";
  const isSetterJr = role === "SETTER_JR";
  const isPartner = role === "PARTNER";
  const canCreateLead = role === "SETTER" || role === "CLOSER" || role === "ADMIN" || role === "SETTER_JR";

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              {roleLabels[role] || role}
            </span>
            <h1 className="font-headline text-2xl font-bold text-on-surface">
              Dashboard
            </h1>
          </div>
          {canCreateLead && (
            <Button
              onClick={() => setShowCreateLeadModal(true)}
              variant="primary"
            >
              <Plus className="w-5 h-5 mr-2" />
              Crear Lead
            </Button>
          )}
        </div>
      </section>

      {isPartner ? (
        <div className="glass-panel p-8 rounded-2xl text-center">
          <p className="text-on-surface-variant">
            Aqui podras ver los leads de tus parcelas asignadas.
          </p>
        </div>
      ) : (
        <KanbanBoard
          key={refreshKey}
          isAdmin={isAdmin}
          isSetterJr={isSetterJr}
          isSetter={isSetter}
        />
      )}

      <CreateLeadModal
        isOpen={showCreateLeadModal}
        onClose={() => setShowCreateLeadModal(false)}
        onSuccess={() => {
          setRefreshKey((k) => k + 1);
          setShowCreateLeadModal(false);
        }}
      />
    </div>
  );
}
