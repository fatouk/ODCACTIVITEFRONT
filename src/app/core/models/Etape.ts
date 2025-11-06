import {Participant} from "@core/models/Participant";
import {Critere} from "@core/models/Critere";
import { U } from "@fullcalendar/core/internal-common";
import { Utilisateur } from "./Utilisateur";

export class Etape {
  id?: number;
  nom?: string;
  listeDebut?: Participant[]; // Doit être un tableau
  listeResultat?: Participant[]; // Doit être un tableau
  statut?: string;
  critere?: Critere;
  dateDebut?: Date;
  dateFin?: Date;
  selected?: boolean;
  created_by?:Utilisateur;

  constructor(data?: Partial<Etape>) {
    if (data) {
      Object.assign(this, data);
      this.listeDebut = Array.isArray(data.listeDebut) ? data.listeDebut : data.listeDebut ? [data.listeDebut] : [];
      this.listeResultat = Array.isArray(data.listeResultat) ? data.listeResultat : data.listeResultat ? [data.listeResultat] : [];
    }
  }
}

interface DebutParticipant {
  nom: string;
}

interface ResultatParticipant {
  nom: string;
}
