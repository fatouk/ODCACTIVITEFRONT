import {Component, NgZone, ViewChild} from '@angular/core';
import {DatatableComponent, NgxDatatableModule, SelectionType} from "@swimlane/ngx-datatable";
import {FormsModule, ReactiveFormsModule, UntypedFormBuilder} from "@angular/forms";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ToastrService} from "ngx-toastr";
import {GlobalService} from "@core/service/global.service";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {Activity} from "@core/models/Activity";
import {of, switchMap} from "rxjs";
import {catchError, map} from "rxjs/operators";
import {NgForOf, NgIf} from "@angular/common";
import autoTable, { RowInput } from 'jspdf-autotable';
import jsPDF from 'jspdf';
import Swal from "sweetalert2";
import {exportToExcel} from "@core/utils/export_utils";
import { co } from '@fullcalendar/core/internal-common';

@Component({
  selector: 'app-liste-debut',
  imports: [
    FormsModule,
    NgxDatatableModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './liste-debut.component.html',
  standalone: true,
  styleUrl: './liste-debut.component.scss'
})
export class ListeDebutComponent {

  @ViewChild(DatatableComponent, { static: false }) table!: DatatableComponent;
  rows = [];
  listeDebut: Person[] = [];
  nomEtape = "";
  filteredListeDebut: Person[] = []
  scrollBarHorizontal = window.innerWidth < 1200;
  filteredData: any[] = [];
  loadingIndicator = true;
  isRowSelected = false;
  reorderable = true;
  public selected: number[] = [];
  columns = [
    { prop: 'nom' },
    { prop: 'prenom' },
    { prop: 'email' },
    { prop: 'phone' },
    { prop: 'genre' },
    { prop: 'activite' },
  ];

  @ViewChild(DatatableComponent, { static: false }) table2!: DatatableComponent;
  selection!: SelectionType;
  constructor(
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private glogalService: GlobalService,
    private ngZone: NgZone,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    window.onresize = () => {
      this.scrollBarHorizontal = window.innerWidth < 1200;
    };
    this.selection = SelectionType.checkbox;
  }

  retour(): void {
    this.router.navigate(["/etape"])
  }

  ngOnInit() {
    /*const id = Number(this.route.snapshot.paramMap.get("id"))
    console.log("ID reçu:", id)
    console.log(this.afficherParticipantsDepuisListe(id));*/
    const navigation = this.router.getCurrentNavigation();
    let liste = navigation?.extras?.state?.['liste'];

    if (!liste) {
      const stored = sessionStorage.getItem('listeDebut');
      liste = stored ? JSON.parse(stored) : null;
    }

    if (!liste) {
      console.warn('❌ Aucune listeDebut reçue.');
      this.router.navigate(['/listeGlobale']);
      return;
    }

    this.afficherParticipantsDepuisListe(liste.id);

  }

  afficherParticipantsDepuisListe(idListe: number) {
    console.log("ID de la liste reçue pour afficher les participants de début:", idListe);  
    this.glogalService.getId("liste", idListe).pipe(
      switchMap((liste: any) => {
        console.log("Données reçues de la table liste:", liste);
        if (liste?.listeDebut === true && liste?.etape?.listeDebut?.length > 0) {
          const participantIds = liste.etape.listeDebut.map((participant: any) => participant.id);
          return this.glogalService.get("participant").pipe(
            map((participants: any[]) => ({
              participants: participants.filter((participant: any) => participantIds.includes(participant.id)),
              nomEtape: liste.etape?.nom ?? ""
            })),

            catchError((error) => {
              console.error("Erreur lors de la récupération des participants:", error);
              return of({ participants: [], nomEtape: "" }); // Return a default value on error
            })
          );

        } else {
          console.warn(liste?.listeDebut !== true ? "Liste non marquée comme listeDebut." : "Aucun participant trouvé pour cette étape.");
          return of({ participants: [], nomEtape: liste?.etape?.nom ?? "" }); // Return default values
        }
      }),
      catchError((error) => {
        console.error("Erreur lors de la récupération des données:", error);
        return of({ participants: [], nomEtape: "" }); // Handle the initial getId error
      })
    ).subscribe(({ participants, nomEtape }) => {
      this.listeDebut = participants;
      this.filteredListeDebut = [...this.listeDebut];
      this.filteredData = [...this.listeDebut];     // Initialisez filteredData avec toutes les données
      this.nomEtape = nomEtape;
    });
    setTimeout(() =>{
      this.loadingIndicator = false;
    },500);
  }

  filterDatatable(event: any) {
    const val = event.target.value.toLowerCase();

    const temp = this.filteredData.filter((item) => {
      return (
        item.nom?.toLowerCase().includes(val) ||
        item.prenom?.toLowerCase().includes(val) ||
        item.email?.toLowerCase().includes(val) ||
        item.phone?.toLowerCase().includes(val) ||
        item.genre?.toLowerCase().includes(val) ||
        (item.activite?.nom?.toLowerCase().includes(val)) // Recherche dans activite.nom
        // Ajoutez d'autres propriétés de l'objet activite si nécessaire
      );
    });

    this.listeDebut = temp;
    this.table.offset = 0;
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

  addToBlacklist(participant: any): void {
    // Appeler l'API pour ajouter à la blacklist
    this.glogalService.post("blacklist", participant).subscribe({
      next: (data) => {
        console.log("Participant ajouté à la blacklist:", data)
        // this.getAllBlacklist();  // Recharger la liste des blacklists
        // Afficher un message de succès
        this.showSuccessToast()
      },
      error: (err) => {
        console.error("Erreur lors de l'ajout à la blacklist:", err)
        this.showErrorToast(err) // Afficher un message d'erreur
      },
    })
  }

  // Fonction pour afficher le toast de succès
  showSuccessToast(): void {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer
        toast.onmouseleave = Swal.resumeTimer
      },
    })
    Toast.fire({
      icon: "success",
      title: "Adjonction réalisée avec un succès éclatant.",
    })
  }

  // Fonction pour afficher un message d'erreur
  showErrorToast(err: any): void {
    let message = "Une erreur est survenue. Veuillez réessayer."
    if (err.error?.message) {
      message = err.error.message
    } else if (err.message) {
      message = err.message
    }

    Swal.fire({
      icon: "error",
      title: "Échec",
      text: message,
      confirmButtonText: "Ok",
      customClass: {
        confirmButton: "bg-red-500 text-white hover:bg-red-600",
      },
    })
  }

  exportExcel(): void {

    const nomActivite = this.listeDebut[0]?.activite?.nom || 'Activite_Inconnue';
    const cleanNomActivite = nomActivite.replace(/\s+/g, '_').replace(/[^\w\-]/g, '');

    const cleanNomEtape = this.nomEtape.replace(/\s+/g, '_').replace(/[^\w\-]/g, '');

    const fileName = `Liste_Debut_${cleanNomActivite}_Etape_${cleanNomEtape || 'Inconnue'}`;

    exportToExcel(
      this.listeDebut.map((item) => ({
        Nom: item.nom,
        Prenom: item.prenom,
        Email: item.email,
        Genre: item.genre,
        Téléphone: item.phone,
        Activité: item.activite.nom,
      })),
      fileName
    )
  }

  exportPDF(): void {
    const doc = new jsPDF()

    // Titre du document
    const title = "Liste debut des Participants"
    doc.setFontSize(16)
    doc.text(title, 14, 15)

    // Préparer les données pour le tableau (convertir undefined en chaînes vides)
    const tableData = this.listeDebut.map((item) => [
      item.nom || "",
      item.prenom || "",
      item.email || "",
      item.genre || "",
      item.phone || "",
      item.activite?.nom || "",
    ])

    // Préparer les en-têtes
    const tableHeaders = ["Nom", "Prénom", "Email", "Genre", "Téléphone", "Activite"]

    // Ajouter le tableau au PDF
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData as RowInput[], // Caster en RowInput pour éviter les erreurs de type
      startY: 20, // Positionner le tableau en dessous du titre
      headStyles: {
        fillColor: [255, 165, 0], // Couleur de fond de l'en-tête (orange ici)
        // textColor: [255, 255, 255], // Couleur du texte (blanc ici)
        // fontSize: 10, // Taille de la police
        // fontStyle: 'bold' // Style de police (gras ici)
      },
    })

    // Télécharger le PDF
    const cleanNomEtape = this.nomEtape.replace(/\s+/g, '_').replace(/[^\w\-]/g, '');

// Récupérer le nom de l’activité (du premier participant par exemple)
    const nomActivite = this.listeDebut[0]?.activite?.nom || 'Activite_Inconnue';
    const cleanNomActivite = nomActivite.replace(/\s+/g, '_').replace(/[^\w\-]/g, '');

    doc.save(`Liste_Debut_${cleanNomActivite}_Etape_${cleanNomEtape || 'Inconnue'}.pdf`);


  }


}

export interface Person {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  phone: string;
  genre: string;
  activite: Activity;
  // Ajoutez d'autres propriétés si nécessaire
}
