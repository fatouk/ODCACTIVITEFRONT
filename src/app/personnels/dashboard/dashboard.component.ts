import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Participant } from '@core/models/Participant';
import { GlobalService } from '@core/service/global.service';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexStroke, ApexMarkers, ApexYAxis, ApexGrid, ApexTitleSubtitle, ApexTooltip, ApexLegend, ApexFill, ApexPlotOptions, ApexResponsive, NgApexchartsModule } from 'ng-apexcharts';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import {
  FormArray,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from "@angular/forms";
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { C, S } from '@angular/cdk/scrolling-module.d-ud2XrbF8';
import { co } from '@fullcalendar/core/internal-common';
import { Etape } from '@core/models/Etape';
import { forkJoin } from 'rxjs';


export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  colors: string[];
  yaxis: ApexYAxis;
  grid: ApexGrid;
  legend: ApexLegend;
  tooltip: ApexTooltip;
  fill: ApexFill;
  title: ApexTitleSubtitle;
  plotOptions: ApexPlotOptions;
  responsive: ApexResponsive[];
};
@Component({
  selector: 'app-dashboard',
 imports: [
    RouterLink,
    NgApexchartsModule,
    NgForOf,FormsModule,
    ReactiveFormsModule,    
    NgxDatatableModule,
    ReactiveFormsModule,
    RouterLink,
],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {  
    public lineChartOptions!: Partial<ChartOptions>;
    public barChartOptions!: Partial<ChartOptions>;
    public stackBarChart!: Partial<ChartOptions>;
    nombreUtilisateurs: number | undefined;
    nombreActivite: number = 0;
    nombreActiviteEncours: number = 0;
    nombreActiviteEnAttente: number = 0;
    nombreActiviteTerminer: number = 0;
    nombreGenre: any[] = [];
    participants:Participant[] = [];
    totalHommes = 0;
    totalFemmes = 0;
    currentUserId: number | null = this.getCurrentUserId();
    selectedActivite: number | 0 = 0;
    selectedEntite: number | 0 = 0;
    selectedEtape:number | 0=0;
    dateDebut: Date | null =null;
    dateFin: Date | null = null;
    activites: any[] = []; // → liste des activités chargées depuis ton API
    entites: any[] = [];  
    etapes:Etape[]=[];
    filteredActivites: any[] = [];
    filteredEtapes: any[] = [];  
    formCriteres!: UntypedFormGroup;

    constructor(private globalService: GlobalService, private fb: UntypedFormBuilder) {
      this.formCriteres = this.fb.group({
        selectedActivite: new UntypedFormControl(''),
        selectedEntite: new UntypedFormControl(''),
        selectedEtape: new UntypedFormControl(''),
        dateDebut: new UntypedFormControl(''),
        dateFin: new UntypedFormControl(''),
        });
    }
  
    ngOnInit() {
      
      this.getParticipants();
      // this.getNombreUitlisateur();
      this.getNombreActivite();
      this.getNombreActiviteEncours();
      this.getNombreActiviteEnAttente();
      this.getNombreActiviteTerminer();
      this.fetchGenreData();
      this.getActivites();
      this.getEtapes();
      this.onEntiteChange() ;
      this.getEntites(); 
      this.applyFilters();
      this.chart2();
      
     
    }
    getActivites() {
      this.globalService.get('activite').subscribe({
        next: (data) => { this.activites = data; },
        error: (err) => {
          console.error('Erreur lors du chargement des activités', err);
        },
      }); }


  getEtapes() {
      this.globalService.get('etape').subscribe({
        next: (data) => { this.etapes = data; },
        error: (err) => {
          console.error('Erreur lors du chargement des etapes', err);
        },
      }); }

    getEntites() {
      this.globalService.get('entite').subscribe({
        next: (data) => { this.entites = data; },   
        error: (err) => {
          console.error('Erreur lors du chargement des entités', err);
        },
      }); }

      getCurrentUserId(): number | null {
  const raw = localStorage.getItem('bearerid');
  // console.log('Raw currentUser from localStorage:', raw);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // si le stockage est juste un id string, parsed sera une string
    if (typeof parsed === 'number') return parsed;
    if (typeof parsed === 'string') return parseInt(parsed, 10);
    // sinon on cherche parsed.id
    if (parsed) return Number(parsed);
    return null;
  } catch {
    // raw n'était pas JSON (peut être un id en string)
    const val = parseInt(raw, 10);
    return isNaN(val) ? null : val;
  }
}
    // Récupérer la liste des participants
    getParticipants() {
      this.globalService.get('participant').subscribe({
        next: (data) => {
          this.applyFilters();
          console.log('Participants chargés :',data);
          console.log("mes critere=====",this.selectedActivite);
          this.participants = data  as Participant[];
          this.totalFemmes = this.participants.filter(p => p.genre === "Femme" ||p.activite?.id===this.selectedActivite).length;
          this.totalHommes = this.participants.filter(p => p.genre === "Homme").length;
          // console.log('Participants chargés :', this.totalFemmes, this.totalHommes);
          this.chart2();
         
        },
        error: (err) => {
          console.error('Erreur lors du chargement des participants', err);
        },
      });
    }
    countParticipants() {
    console.log('Nombre total de participants :', this.participants);
    this.totalHommes = this.participants.filter(p => p.phone === "Homme").length;
    this.totalFemmes = this.participants.filter(p => p.phone === "Femme").length;
   
  }
    // getNombreUitlisateur() {
    //   this.globalService.get("utilisateur/nombre").subscribe({
    //     next: (count) => this.nombreUtilisateurs = count,
    //     error: err => console.log(err),
    //   });
    // }
  
    getNombreActivite() {
      this.globalService.getId("activite/nombre",this.currentUserId!).subscribe({
        next: (count) => this.nombreActivite = count,
        error: err => console.log(err),
      });
    }
  
    getNombreActiviteEncours() {
      this.globalService.getId("activite/nombreActivitesEncours",this.currentUserId!).subscribe({
        next: (count) => this.nombreActiviteEncours = count,
        error: err => console.log(err),
      });
    }
  
    getNombreActiviteEnAttente() {
      this.globalService.getId("activite/nombreActivitesEnAttente",this.currentUserId!).subscribe({
        next: (count) => this.nombreActiviteEnAttente = count,
        error: err => console.log(err),
      });
    }
  
    getNombreActiviteTerminer() {
      this.globalService.getId("activite/nombreActivitesTerminer",this.currentUserId!).subscribe({
        next: (count) => this.nombreActiviteTerminer = count,
        error: err => console.log(err),
      });
    }
  
    fetchGenreData() {
      this.globalService.get("reporting/participants-par-genre").subscribe({
        next: (data) => {
          this.nombreGenre = data;
          this.chart2();
        },
        error: (err) => console.error("Erreur lors de la récupération des données de genre :", err),
      });
    }
  
    private chart2() {
    // console.log("Participants pour le graphique :", this.totalFemmes, this.totalHommes);
     
    console.log('Total Hommes :', this.totalHommes);
    console.log('Total Femmes :', this.totalFemmes);
         this.barChartOptions = {  
        series: [
          {
            name: 'Hommes',
            data: [this.totalFemmes],
          },
          {
            name: 'Femmes',
            data: [this.totalHommes],
          },
        ],
        chart: {
          type: 'bar',
          height: 350,
          stacked: true,
          toolbar: {
            show: false,
          },
          foreColor: '#000',
        },
        colors: ['#f1a535', '#000'],
        plotOptions: {
          bar: {
            horizontal: false,
            barHeight: '80%',
            columnWidth: '30%',
            borderRadius: 5,
          },
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          width: 1,
          colors: ['#fff'],
        },
  
        grid: {
          xaxis: {
            lines: {
              show: false,
            },
          },
          borderColor: '#9aa0ac',
        },
        yaxis: {
          min: 0,
          // max: 5,
          title: {
            text: 'Participants',
          },
        },
        tooltip: {
          shared: false,
          theme: 'dark',
          x: {
            formatter: function (val) {
              return val.toString();
            },
          },
          y: {
            formatter: function (val) {
              return val.toString();
            },
          },
        },
        xaxis: {
          categories: [
            'Hommes et Femmes'
          ],
          title: {
            text: 'Genres',
          },
          labels: {
            formatter: (val) =>
              Math.abs(Math.round(parseInt(val, 10))).toString(),
          },
        },
      };
    }
  
applyFilters() {
  this.dateDebut = this.formCriteres.get('dateDebut')?.value;
  this.dateFin = this.formCriteres.get('dateFin')?.value;
  this.selectedActivite = this.formCriteres.get('selectedActivite')?.value;
  this.selectedEntite = this.formCriteres.get('selectedEntite')?.value;
  this.selectedEtape = this.formCriteres.get('selectedEtape')?.value;

  forkJoin({
    stats: this.globalService.getStatsFiltres(this.dateDebut!, this.dateFin!, this.selectedActivite, this.selectedEntite, this.selectedEtape),
    blacklist: this.globalService.get("blacklist") // Récupérer la blacklist
  }).subscribe(({ stats, blacklist }: any) => {
    // Filtrer les participants blacklistés dans les statistiques
      const statsFiltrees = stats.filter((participant: any) => 
      !blacklist.some((b: any) => b.email === participant.email)
    );
    this.updateChart(statsFiltrees);
    this.chart2();
   });
}


updateChart(data: any) {
  // console.log("data Données mises à jour pour le graphique :", data);
  this.participants = data  as Participant[];
  this.totalFemmes = this.participants.filter(p => p.genre === "Femme").length;
  this.totalHommes = this.participants.filter(p => p.genre === "Homme").length;
  this.barChartOptions.series = [
    {
      name: "Participants",
      data: data.series // ← liste des valeurs
    }
  ];

  this.barChartOptions.xaxis = {
    categories: data.labels // ← catégories mises à jour
  };
}
onEntiteChange() {
  const entiteId = this.formCriteres.get('selectedEntite')?.value;
  if (!entiteId) { 
    // console.log("toutes sans selection :", this.activites);
    // si aucune entité sélectionnée → afficher toutes les activités
    this.filteredActivites = this.activites;
  } else {
    // console.log("Filtrage des activités pour l'entité ID :", this.activites);
    // filtrer les activités appartenant à l'entité choisie
    this.filteredActivites = this.activites.filter(a => a.entite.id == entiteId);
  }

  // reset la sélection d’activité car peut devenir invalide
  this.formCriteres.get('selectedActivite')?.setValue('');

  this.applyFilters();
}
onActiviteChange() {
  const activiteId = this.formCriteres.get('selectedActivite')?.value;
console.log("activite sélectionnée :", activiteId);
  if (!activiteId) { 
    // console.log("toutes sans selection :", this.etapes);
    // si aucune entité sélectionnée → afficher toutes les activités
    this.filteredEtapes= this.etapes;
  } else {
    // console.log("Filtrage des etapes pour l'activite ID :", this.etapes);
    // filtrer les activités appartenant à l'entité choisie
    this.filteredEtapes = this.etapes.filter(a => a.activite?.id == activiteId);
  }

  // reset la sélection d’etape 
  this.formCriteres.get('selectedEtape')?.setValue('');

  this.applyFilters();
}
}
