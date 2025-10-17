import {Role} from "@core/models/Role";
import {Entite} from "@core/models/Entite";

export class Utilisateur {
  id?: number;
  nom?: string;
  prenom?: string;
  email?: string;
  phone?: string;
  genre?: string;
  role?: Role;
  entite?: Entite;
}
