import {Etape} from "@core/models/Etape";

export class Liste {
  id!: number;
  dateHeure!: Date;
  listeDebut!: boolean;
  listeResultat!: boolean;
  etape!: Etape;
}
