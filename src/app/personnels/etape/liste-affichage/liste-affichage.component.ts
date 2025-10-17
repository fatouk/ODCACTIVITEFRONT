import {Component, NgZone, ViewChild} from '@angular/core';
import {Liste} from "@core/models/Liste";
import {GlobalService} from "@core/service/global.service";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {DatatableComponent, NgxDatatableModule, SelectionType} from "@swimlane/ngx-datatable";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {DatePipe, NgIf} from "@angular/common";
import {Etape} from "@core/models/Etape";
import Swal from "sweetalert2";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ToastrService} from "ngx-toastr";

@Component({
  selector: 'app-liste-affichage',
  imports: [
    FormsModule,
    NgxDatatableModule,
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    NgIf
  ],
  templateUrl: './liste-affichage.component.html',
  styleUrl: './liste-affichage.component.scss'
})
export class ListeAffichageComponent {
  @ViewChild(DatatableComponent, { static: false }) table!: DatatableComponent;

  listes: Liste[] = [];
  filteredListes: Liste[] = [];
  rows = [];
  scrollBarHorizontal = window.innerWidth < 1200;
  selectedRowData!: selectListeInterface;
  filteredData: any[] = [];
  loadingIndicator = true;
  isRowSelected = false;
  reorderable = true;
  public selected: number[] = [];
  columns = [
    { prop: 'etape' },
    { prop: 'dateHeure' },
  ];
  @ViewChild(DatatableComponent, { static: false }) table2!: DatatableComponent;
  selection!: SelectionType;

  constructor(
    private globalService: GlobalService,
    private ngZone: NgZone,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router,
    private glogalService: GlobalService,
  ) {}

  retour(): void {
    this.router.navigate(["/etape"])
  }

  onSelect({ selected }: { selected: any }) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);

    if (this.selected.length === 0) {
      this.isRowSelected = false;
    } else {
      this.isRowSelected = true;
    }
  }

  filterDatatable(event: any) {
    const val = event.target.value.toLowerCase();

    this.listes = this.filteredData.filter((item) => {
      return Object.values(item).some((field: any) =>
        field?.toString().toLowerCase().includes(val)
      );
    });

    this.table.offset = 0;
  }


  ngOnInit(): void {
    this.getAllListe();

    // Récupérer le filtre depuis les paramètres d'URL
    this.route.queryParams.subscribe(params => {
      if (params['filter']) {
        this.applyFilter(params['filter']);
      }
    });
  }

  getAllListe() {
    this.globalService.get("liste").subscribe({
      next: (value: Liste[]) => {
        this.ngZone.run(() => {
          this.listes = value;
          // Appliquer le filtre après récupération des données
          setTimeout(() =>{
            this.loadingIndicator = false;
          },500);
          const currentFilter = this.route.snapshot.queryParams['filter'] || 'all';
          this.applyFilter(currentFilter);        });
      },
      error: (err: any) => {
        console.error('Erreur lors de la récupération des données:', err);
      }
    });
  }

  applyFilter(filter: string) {
    switch (filter) {
      case 'debut':
        this.filteredListes = this.listes.filter(liste => liste.listeDebut);
        break;
      case 'resultat':
        this.filteredListes = this.listes.filter(liste => liste.listeResultat);
        break;
      case 'all':
      default:
        this.filteredListes = [...this.listes];
        break;
    }
  }

  openListeDebut(row: Liste) {
    sessionStorage.setItem('listeDebut', JSON.stringify(row));
    this.router.navigate(['/listeDebut']);
  }

  openListeResultat(row: Liste) {
    sessionStorage.setItem('listeResultat', JSON.stringify(row));
    this.router.navigate(['/listeResultat']);
  }


  deleteSelected() {
    Swal.fire({
      title: 'Voulez vous vraiment supprimer?',
      showCancelButton: true,
      confirmButtonColor: '#8963ff',
      cancelButtonColor: '#fb7823',
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non'
    }).then((result) => {
      if (result.value) {
        this.selected.forEach((row) => {
          this.deleteRecord(row);
        });
        this.deleteRecordSuccess(this.selected.length);
        this.selected = [];
        this.isRowSelected = false;
      }
    });
  }

  deleteSingleRow(row: any) {
    Swal.fire({
      title: 'Voulez vous vraiment supprimer?',
      showCancelButton: true,
      confirmButtonColor: '#8963ff',
      cancelButtonColor: '#fb7823',
      confirmButtonText: 'Oui',
    }).then((result) => {
      if (result.value) {
        this.deleteRecord(row);
        this.deleteRecordSuccess(1);
      }
    });
  }

  deleteRecord(row: any) {
    this.glogalService.delete("liste", row.id!).subscribe({
      next:(response) =>{
        this.listes = response;
        this.loadingIndicator = true;
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
        this. getAllListe();

      }, error: (err: { status: number; error: any; message?: string }) => {
        console.error('Erreur reçue:', err);

        let message = 'Une erreur est survenue. Veuillez réessayer.';
        let title = '<span class="text-red-500">Échec</span>';

        if (err.error?.message) {
          message = err.error.message;
        } else if (err.message) {
          message = err.message;
        }

        Swal.fire({
          icon: 'error',
          title: title,
          text: message,
          confirmButtonText: 'Ok',
          customClass: {
            confirmButton: 'bg-red-500 text-white hover:bg-red-600',
          },
        });
      }
    })
  }

  deleteRecordSuccess(count: number) {
    this.toastr.success(count + 'Eradication diligente pleinement consommée.', '');
  }

}
export interface selectListeInterface {
  dateHeure: Date;
  listeDebut: boolean;
  listeResultat: boolean;
  etape: Etape;
}
