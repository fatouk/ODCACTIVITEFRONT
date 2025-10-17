import { Component, OnInit, ViewChild } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexStroke, ApexMarkers, ApexYAxis, ApexGrid, ApexTitleSubtitle, ApexTooltip, ApexLegend, ApexFill, ApexPlotOptions, ApexResponsive, NgApexchartsModule } from 'ng-apexcharts';
import { NgScrollbar } from 'ngx-scrollbar';
import { NgbProgressbar } from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';
import {GlobalService} from "@core/service/global.service";

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
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
    imports: [
        RouterLink,
        NgApexchartsModule,

    ]
})
export class MainComponent implements OnInit {
  public lineChartOptions!: Partial<ChartOptions>;
  public barChartOptions!: Partial<ChartOptions>;
  public stackBarChart!: Partial<ChartOptions>;


  nombreUtilisateurs: number | undefined;
  nombreActivite: number = 0;
  nombreActiviteEncours: number = 0;
  nombreActiviteEnAttente: number = 0;
  nombreActiviteTerminer: number = 0;
  nombreGenre: any[] = [];

  constructor(private globalService: GlobalService) {}

  ngOnInit() {
    this.chart2();
    this.getNombreUitlisateur();
    this.getNombreActivite();
    this.getNombreActiviteEncours();
    this.getNombreActiviteEnAttente();
    this.getNombreActiviteTerminer();
    this.fetchGenreData();
  }

  getNombreUitlisateur() {
    this.globalService.get("utilisateur/nombre").subscribe({
      next: (count) => this.nombreUtilisateurs = count,
      error: err => console.log(err),
    });
  }

  getNombreActivite() {
    this.globalService.get("activite/nombre").subscribe({
      next: (count) => this.nombreActivite = count,
      error: err => console.log(err),
    });
  }

  getNombreActiviteEncours() {
    this.globalService.get("activite/nombreActivitesEncours").subscribe({
      next: (count) => this.nombreActiviteEncours = count,
      error: err => console.log(err),
    });
  }

  getNombreActiviteEnAttente() {
    this.globalService.get("activite/nombreActivitesEnAttente").subscribe({
      next: (count) => this.nombreActiviteEnAttente = count,
      error: err => console.log(err),
    });
  }

  getNombreActiviteTerminer() {
    this.globalService.get("activite/nombreActivitesTerminer").subscribe({
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
    const hommeData = this.nombreGenre.find(g => g.genre === "Homme")?.count || 0;
    const femmeData = this.nombreGenre.find(g => g.genre === "Femme")?.count || 0;
    this.barChartOptions = {

      series: [
        {
          name: 'Hommes',
          data: [hommeData],
        },
        {
          name: 'Femmes',
          data: [femmeData],
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

}
