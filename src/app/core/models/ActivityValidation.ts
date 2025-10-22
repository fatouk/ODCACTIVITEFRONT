export class ActivityValidation {
  id?: number;
  commentaire?: string;
  date?: string;
  statut?: 'En_Attente' | 'Valider' | 'Rejeter';
  fichierChiffre?: Blob;
  fichierjoint?: string;
  activiteId?: number;
  superviseurId?: number;
  constructor(data?: Partial<ActivityValidation>) {
    if (data) {
      Object.assign(this, data);
    }
}}