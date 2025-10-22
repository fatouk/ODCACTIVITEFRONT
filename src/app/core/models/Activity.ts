import {Etape} from "@core/models/Etape";
import {Entite} from "@core/models/Entite";
import {Salle} from "@core/models/Salle";
import { ActivityValidation } from "./ActivityValidation";

export class Activity {
  id?: number;
  nom?: string;
  titre?: string;
  description?: string;
  lieu?: string;
  objectifParticipation?: number;
  dateDebut?: Date;
  dateFin?: Date;
  statut?: string;
  etapes?: Etape[];
  entite?: Entite;
  typeActivite?: null;
  salleId?: Salle;
  activitevalidation?: ActivityValidation[];

  constructor(data?: Partial<Activity>) {
    if (data) {
      Object.assign(this, data);
      this.etapes = Array.isArray(data.etapes) ? data.etapes : data.etapes ? [data.etapes] : [];
    }
  }
}
