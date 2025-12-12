import {Component, NgZone, ViewChild} from '@angular/core';
import {DatatableComponent, NgxDatatableModule, SelectionType} from "@swimlane/ngx-datatable";
import {UntypedFormBuilder} from "@angular/forms";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ToastrService} from "ngx-toastr";
import {GlobalService} from "@core/service/global.service";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {forkJoin, of, switchMap} from "rxjs";
import {catchError, map} from "rxjs/operators";
import {Activity} from "@core/models/Activity";
import {exportToExcel} from "@core/utils/export_utils";
import jsPDF from "jspdf";
import autoTable, {RowInput} from "jspdf-autotable";
import Swal from "sweetalert2";
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-liste-resultat',
  imports: [
    NgxDatatableModule,
    RouterLink,
    NgIf
],
  templateUrl: './liste-resultat.component.html',
  styleUrl: './liste-resultat.component.scss'
})
export class ListeResultatComponent {

  @ViewChild(DatatableComponent, { static: false }) table!: DatatableComponent;
  rows = [];
  listeResultat: Person[] = [];
  nomEtape = "";
  filteredListeResultat: Person[] = []
  scrollBarHorizontal = window.innerWidth < 1200;
  filteredData: any[] = [];
  loadingIndicator = true;
  isRowSelected = false;
  reorderable = true;
  public selected: number[] = [];
  currentUserId: number | null = this.getCurrentUserId();
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
      const stored = sessionStorage.getItem('listeResultat');
      liste = stored ? JSON.parse(stored) : null;
    }

    if (!liste) {
      console.warn('❌ Aucune listeResultat reçue.');
      this.router.navigate(['/listeGlobale']);
      return;
    }

    this.afficherParticipantsDepuisListe(liste.id, 'resultat');
  }

// PERSONNALISER LA FONCTION POUR GERER LES LISTES DEBUT ET RESULTAT
afficherParticipantsDepuisListe(idListe: number, typeListe: 'debut' | 'resultat') {
  this.loadingIndicator = true;

  this.glogalService.getId("liste", idListe).pipe(
    switchMap((liste: any) => {
      // Déterminer le champ à utiliser selon le type
      const listeFlag = typeListe === 'resultat' ? liste?.listeDebut : liste?.listeResultat;
      const listeParticipants =  liste?.participants;

      if (listeFlag === true && listeParticipants?.length > 0) {
        const participantIds = listeParticipants.map((p: any) => p.id);

        // On récupère en parallèle tous les participants et la blacklist
        return forkJoin({
          participants: this.glogalService.get("participant"),
          blacklist: this.glogalService.get("blacklist")
         
        }).pipe(
          map(({ participants, blacklist }: any) => {
            console.log("Blacklist reçue:", blacklist);
             console.log("participants reçue:", participants);
            // Filtrer les participants présents dans la liste de l'étape ET non blacklists
            const filtered = participants.filter(
              (p: any) => participantIds.includes(p.id) &&
                          !blacklist.some((b: any) => b.email === p.email)
            );
            return {
              participants: filtered,
              nomEtape: liste.etape?.nom ?? ""
            };
          }),
          catchError((error) => {
            console.error("Erreur lors de la récupération des participants ou blacklist:", error);
            return of({ participants: [], nomEtape: "" });
          })
        );
      } else {
        console.warn(listeFlag !== true ? "Liste non marquée comme active." : "Aucun participant trouvé pour cette étape.");
        return of({ participants: [], nomEtape: liste?.etape?.nom ?? "" });
      }
    }),
    catchError((error) => {
      console.error("Erreur lors de la récupération de la liste:", error);
      return of({ participants: [], nomEtape: "" });
    })
  ).subscribe(({ participants, nomEtape }) => {
    if (typeListe === 'debut') {
      this.listeResultat = participants;
      this.filteredListeResultat = [...participants];
    } 
    this.filteredData = [...participants];
    this.nomEtape = nomEtape;
    this.loadingIndicator = false;
  });
}
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
//   afficherParticipantsDepuisListe(idListe: number) {
//   console.log("ID reçu pour afficher la liste résultat :", idListe);

//   this.loadingIndicator = true;

//   this.glogalService.getId("liste", idListe).pipe(
//     map((liste: any) => {
//       console.log("Données liste reçues :", liste);

//       // Vérifier si la liste est bien de type "résultat"
//       if (liste?.listeResultat !== true) {
//         console.warn("Cette liste n'est pas une liste de résultat.");
//         return { participants: [], nomEtape: liste?.etape?.nom ?? "" };
//       }

//       // Vérifier s'il y a des participants
//       if (!liste.participants || liste.participants.length === 0) {
//         console.warn("Aucun participant dans cette liste de résultat.");
//         return { participants: [], nomEtape: liste?.etape?.nom ?? "" };
//       }

//       // On retourne les données trouvées
//       return {
//         participants: liste.participants,
//         nomEtape: liste.etape?.nom ?? ""
//       };
//     }),
//     catchError(error => {
//       console.error("Erreur lors de la récupération de la liste :", error);
//       return of({ participants: [], nomEtape: "" });
//     })
//   )
//   .subscribe(({ participants, nomEtape }) => {
//     this.listeResultat = participants;
//     this.filteredListeResultat = [...participants];
//     this.filteredData = [...participants];
//     this.nomEtape = nomEtape;

//     this.loadingIndicator = false;
//   });
// }


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

    this.listeResultat = temp;
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

  exportExcel(): void {

    const nomActivite = this.listeResultat[0]?.activite?.nom || 'Activite_Inconnue';
    const cleanNomActivite = nomActivite.replace(/\s+/g, '_').replace(/[^\w\-]/g, '');

    const cleanNomEtape = this.nomEtape.replace(/\s+/g, '_').replace(/[^\w\-]/g, '');

    const fileName = `Liste_Resultat_${cleanNomActivite}_Etape_${cleanNomEtape || 'Inconnue'}`;

    exportToExcel(
      this.listeResultat.map((item) => ({
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
    const title = "Liste resultat des Participants"
    doc.setFontSize(16)
    doc.text(title, 14, 15)

    // Préparer les données pour le tableau (convertir undefined en chaînes vides)
    const tableData = this.listeResultat.map((item) => [
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
    const nomActivite = this.listeResultat[0]?.activite?.nom || 'Activite_Inconnue';
    const cleanNomActivite = nomActivite.replace(/\s+/g, '_').replace(/[^\w\-]/g, '');

    doc.save(`Liste_Resultat_${cleanNomActivite}_Etape_${cleanNomEtape || 'Inconnue'}.pdf`);


  }

  addToBlacklist(participant: any): void {
    // Appeler l'API pour ajouter à la blacklist
    this.glogalService.post("blacklist", participant).subscribe({
      next: (data) => {
        console.log("Participant ajouté à la blacklist:", data)
        // this.getAllBlacklist();  // Recharger la liste des blacklists
         this.filteredData = this.filteredData.filter(p => p.id !== participant.id);
        this.filteredListeResultat = this.filteredListeResultat.filter(p => p.id !== participant.id);
        this.listeResultat = this.listeResultat.filter(p => p.id !== participant.id);

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
