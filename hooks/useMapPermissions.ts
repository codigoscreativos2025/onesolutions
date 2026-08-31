import { useMemo } from 'react';
import { MapUser, MapParcel, LeadPermissions } from '@/types/map';
import { useLocale } from '@/lib/locale-context';

export function useMapPermissions(user: MapUser, parcel: MapParcel | null): LeadPermissions {
  const { t } = useLocale();

  return useMemo(() => {
    const defaultPerms: LeadPermissions = {
      canEditNotes: false,
      canChangeTags: false,
      canCreateLead: false,
      canViewDetails: false,
      blockedReason: null,
    };

    if (!parcel || !user) return defaultPerms;

    const role = user.role.toUpperCase();
    const activeVisits = parcel.visits?.filter(v => v.stage !== "CANCELLED" && v.stage !== "CLOSED") || [];
    const closedVisits = parcel.visits?.filter(v => v.stage === "CLOSED") || [];
    const hasActiveLead = activeVisits.length > 0;
    const isAvailable = parcel.status === "AVAILABLE" && !hasActiveLead;
    const hasPriorProjects = closedVisits.length > 0;

    const visit = activeVisits[0]; // The current active lead/visit
    const visitStage = visit?.stage || "IN_PROGRESS";
    const isLeadStage = visitStage === "IN_PROGRESS"; // Indicates it hasn't progressed far with closer yet
    const hasPanelSolar = visit?.projects?.some((p) =>
      p.projectType.name.toLowerCase().includes("panel solar")
    ) || false;

    const visitSetterId = visit?.setter?.id || visit?.setterId;
    const visitCloserId = visit?.closer?.id || visit?.closerId;

    const isTakenByMe = parcel.setter?.id === parseInt(user.id);
    const userIdNum = parseInt(user.id);

    // Determines if the user is in the same team as the lead
    const isMyTeamLead = () => {
      if (role === 'CLOSER') {
        // I am a closer. Is this my lead or from my setters?
        // A setter under me should have their closerId === my id, but we might not have that in `parcel.setter`.
        // However, if the visit is assigned to me (visitCloserId === my id), then it's mine.
        if (visitCloserId === userIdNum) return true;
        // If it's a lead created by me
        if (visitSetterId === userIdNum) return true;
        return false; 
      }
      if (role === 'SETTER' || role === 'TRAINEE' || role === 'SETTER_JR') {
        // I am a setter. It's my team if it belongs to my closer or me.
        if (visitSetterId === userIdNum) return true;
        if (user.closerId && visitCloserId === user.closerId) return true;
        return false;
      }
      return false;
    };

    // Defaults for everyone who is not admin
    let canEditNotes = false;
    let canChangeTags = false;
    let canCreateLead = false;
    let canViewDetails = false;
    let blockedReason: string | null = null;

    if (role === 'ADMIN') {
      return {
        canEditNotes: false,
        canChangeTags: false,
        canCreateLead: false,
        canViewDetails: true,
        blockedReason: null, // Admins don't get blocked from viewing details
      };
    }

    // CREATE LEAD PERMISSION (Applies when clicking "Knock Door" / "Crear Lead")
    // Anyone can create if available or customer, EXCEPT if it's currently an active lead from ANOTHER closer/team
    if (!hasActiveLead && (isAvailable || parcel.status === "CUSTOMER" || hasPriorProjects)) {
      canCreateLead = true;
    }

    // VIEW DETAILS, EDIT NOTES, CHANGE TAGS
    if (hasActiveLead) {
      if (role === 'SETTER_JR') {
        // Setter Jr: can edit notes/tags if it's their lead and hasn't been transferred (isLeadStage)
        if (isTakenByMe || visitSetterId === userIdNum) {
          if (isLeadStage) {
            canEditNotes = true;
            canChangeTags = true;
            canViewDetails = true;
          } else {
            // Locked: Transferred to closer
            canViewDetails = false;
            blockedReason = "Este lead ya fue transferido al closer";
          }
        } else {
          // Not their lead
          canViewDetails = false;
          canCreateLead = false;
          blockedReason = "Este lead pertenece a otro asesor.";
        }
      } 
      else if (role === 'SETTER' || role === 'TRAINEE') {
        // Trainee / Setter:
        if (isTakenByMe || visitSetterId === userIdNum) {
           // My own lead
           canEditNotes = true;
           canChangeTags = true;
           canViewDetails = true;
           if (hasPanelSolar && !isLeadStage) {
             // Still can view details if it has solar panel? Wait, prompt says:
             // "Solo puede usar el botón Ver Detalles en: Sus leads creados directamente. Leads que haya transferido a su closer únicamente si contienen la etiqueta Panel Solar."
             // "Restricción: NO puede ver detalles de leads en el closer que no tengan panel solar"
             canEditNotes = false; // Usually when transferred, can't edit
             canChangeTags = false;
           }
        } else {
          // Not created by me directly
          if (isMyTeamLead()) {
            if (hasPanelSolar) {
              canViewDetails = true;
            } else {
              blockedReason = t.map.onlySolarPanelLeads || "Solo puedes ver leads con Panel Solar de tu equipo.";
            }
          } else {
             blockedReason = t.map.onlyOwnLeads || "Solo puedes ver tus propios leads.";
          }
        }
      } 
      else if (role === 'CLOSER') {
        // Closer:
        // can manage only their own leads or transferred by their setter
        if (isMyTeamLead()) {
          canEditNotes = true;
          canChangeTags = true;
          canViewDetails = true;
        } else {
          // Isolation: cannot see leads/parcels of other closers
          canViewDetails = false;
          blockedReason = "No tienes acceso a los leads de otros closers.";
        }
      }
    } else {
       // If no active lead, but they claimed the parcel, they can change tags/notes
       if (isAvailable || parcel.status === "CUSTOMER") {
         canChangeTags = true; // Typically anyone can tag a free house
         canEditNotes = true;
       }
    }

    return {
      canEditNotes,
      canChangeTags,
      canCreateLead,
      canViewDetails,
      blockedReason,
    };
  }, [user, parcel, t]);
}
