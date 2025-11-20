import { Component } from '@angular/core';
import { CommonModule, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { GlobalService } from '@core/service/global.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Activite { id: number; nom: string; }
interface Entite { id: number; nom: string; dateCreation: string; }
interface ReportingItem {
  participantNom: string;
  participantPrenom: string;
  participantEmail: string;
  participantTelephone: string;
  participantGenre: string;
  activiteNom: string;
  entiteNom: string;
  entiteDateCreation?: string;
}

@Component({
  selector: 'app-reporting',
  standalone: true,
  imports: [CommonModule, FormsModule, NgFor, NgIf, TitleCasePipe],
  templateUrl: './reporting.component.html',
  styleUrls: ['./reporting.component.scss']
})
export class ReportingComponent {
  types = ['activite', 'entite'];
  selectedType: string | null = null;
  activites: Activite[] = [];
  entites: Entite[] = [];
  reportingItems: ReportingItem[] = [];
  dateDebut: string = '';
  dateFin: string = '';

  constructor(private globalService: GlobalService) {}

  // Changement de type
  onTypeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedType = select.value || null;
    this.reportingItems = [];
    this.loadFilterOptions();
  }

  // Charger activités ou entités
  loadFilterOptions() {
    if (this.selectedType === 'activite') {
      this.globalService.get('reporting/activites').subscribe({
        next: (res: Activite[]) => this.activites = res,
        error: () => Swal.fire('Erreur', 'Impossible de charger les activités', 'error'),
      });
    } else if (this.selectedType === 'entite') {
      this.globalService.get('reporting/entites').subscribe({
        next: (res: Entite[]) => this.entites = res,
        error: () => Swal.fire('Erreur', 'Impossible de charger les entités', 'error'),
      });
    }
  }

  // Filtrer le reporting selon l’option choisie
  onFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const id = select.value;
    this.loadReporting(id);
  }

  // Charger les données du reporting
  
   // Charger les données du reporting
loadReporting(id?: string) {
  if (!this.selectedType) return;

  let endpoint = '';
  const params: any = {};

  if (this.selectedType === 'activite') {
    endpoint = `reporting/activite/${id}`;
  } else if (this.selectedType === 'entite') {
    endpoint = 'reporting/entite';
    if (id) params.entiteId = id;
    if (this.dateDebut) params.dateDebut = this.dateDebut;
    if (this.dateFin) params.dateFin = this.dateFin;
  }

  console.log('Requête reporting:', { endpoint, params }); // Debug

  this.globalService.get(endpoint, params).subscribe({
    next: (res: ReportingItem[]) => {
      this.reportingItems = res;
      console.log('Données reçues:', res); // Debug
      if (res.length === 0) {
        Swal.fire('Info', 'Aucune donnée trouvée pour ces critères', 'info');
      }
    },
    error: (error) => {
      console.error('Erreur complète:', error);
      Swal.fire('Erreur', 'Impossible de charger les données du reporting', 'error');
    },
  });
}
  // Export Excel
  exportReportingToExcel() {
    if (!this.reportingItems || this.reportingItems.length === 0) {
      Swal.fire('Info', 'Aucune donnée à exporter', 'info');
      return;
    }

    const exportData = this.reportingItems.map(item => ({
      Nom: item.participantNom,
      Prenom: item.participantPrenom,
      Genre: item.participantGenre,
      Email: item.participantEmail,
      Téléphone: item.participantTelephone,
      Activité: item.activiteNom,
      Entité: item.entiteNom,
      'Date de création': item.entiteDateCreation
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

    // En-têtes en gras et centrés
    const range = XLSX.utils.decode_range(worksheet['!ref']!);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = { font: { bold: true }, alignment: { horizontal: 'center' } };
    }

    // Ajuster largeur automatique des colonnes
    const colWidths = Object.keys(exportData[0]).map(key => ({
      wch: Math.max(...exportData.map(d => (d as any)[key]?.toString().length || 0), key.length) + 5
    }));
    worksheet['!cols'] = colWidths;

    const workbook: XLSX.WorkBook = {
      Sheets: { 'Reporting': worksheet },
      SheetNames: ['Reporting']
    };

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'reporting_participants.xlsx');
  }
}
