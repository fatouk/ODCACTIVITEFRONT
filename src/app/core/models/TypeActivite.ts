import {Entite} from "@core/models/Entite";
import { Utilisateur } from "./Utilisateur";

export class TypeActivite{
  id?: number;
  type?: string;
  entiteId?: Entite;
  createdBy?: Utilisateur;
}
