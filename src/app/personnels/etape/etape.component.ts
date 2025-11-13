import {Component, NgZone, ViewChild} from '@angular/core';
import {DatatableComponent, NgxDatatableModule, SelectionType} from "@swimlane/ngx-datatable";
import {Etape} from "@core/models/Etape";
import {
  FormArray,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from "@angular/forms";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ToastrService} from "ngx-toastr";
import {GlobalService} from "@core/service/global.service";
import Swal from "sweetalert2";
import {Critere} from "@core/models/Critere";
import {Participant} from "@core/models/Participant";
import {NgForOf, NgIf} from "@angular/common";
import {Router, RouterLink} from "@angular/router";
import {firstValueFrom} from "rxjs";
import {ListeGlobaleComponent} from "./liste-globale/liste-globale.component";
import {AuthService} from "@core";
import { C } from '@angular/cdk/scrolling-module.d-ud2XrbF8';
import { Liste } from '@core/models/Liste';

@Component({
  selector: 'app-etape',
  imports: [
    FormsModule,
    NgForOf,
    NgIf,
    NgxDatatableModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './etape.component.html',
  standalone: true,
  styleUrl: './etape.component.scss'
})
export class EtapeComponent {

  @ViewChild(DatatableComponent, { static: false }) table!: DatatableComponent;
  @ViewChild('listeModal') listeModalComponent: ListeGlobaleComponent | undefined; // Référence au composant ListeGlobale

  rows = [];
  etape:  Etape[] = [];
  critere:  Critere[] = [];
  selectedCriteres: number[] = [];
  selectedFile: File[] = [];
  uploading: boolean = false;
  selectedEtapeId: number | null = null;
  currentEtapeNom: string | undefined; // Assurez-vous que cette propriété est définie
  scrollBarHorizontal = window.innerWidth < 1200;
  selectedRowData!: selectEtapeInterface;
  filteredData: any[] = [];
  editForm: UntypedFormGroup;
  register!: UntypedFormGroup;
  loadingIndicator = true;
  isRowSelected = false;
  reorderable = true;
  public selected: number[] = [];
  useRole: string[];
  currentUserId: number | null = this.getCurrentUserId();
  columns = [
    { prop: 'nom' },
    { prop: 'dateDebut' },
    { prop: 'dateFin' },
  ];

  @ViewChild(DatatableComponent, { static: false }) table2!: DatatableComponent;
  selection!: SelectionType;
  constructor(
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private glogalService: GlobalService,
    private ngZone: NgZone,
    private router: Router,
    private authService: AuthService
  ) {
    this.editForm = this.fb.group({
      id: new UntypedFormControl(),
      nom: new UntypedFormControl(),
      dateDebut: new UntypedFormControl(),
      dateFin: new UntypedFormControl(),
      critere: new UntypedFormControl(),
    });
    window.onresize = () => {
      this.scrollBarHorizontal = window.innerWidth < 1200;
    };
    this.selection = SelectionType.checkbox;
    this.useRole = this.authService.getCurrentUserFromStorage().roles;
  }

  // select record using check box
  onSelect({ selected }: { selected: any }) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);

    if (this.selected.length === 0) {
      this.isRowSelected = false;
    } else {
      this.isRowSelected = true;
    }
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

  ngOnInit() {
    this.getAllEtape();
    this.getAllCritere();
    this.register = this.fb.group({
      id: [''],
      nom: ['', [Validators.required]],
      dateDebut: ['', [Validators.required]],
      dateFin: ['', [Validators.required]],
      critere:this.fb.array ([], [Validators.required]),

    });
  }
  // fetch data
  getAllCritere(){
    this.loadingIndicator = true;
    this.glogalService.get('critere').subscribe({
      next:(value: Critere[]) =>{
        this.critere = value;
        this.filteredData = [...value];
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
      }
    })
  }

  onCheckboxChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const critereArray = this.register.get('critere') as FormArray;

    if (checkbox.checked) {
      critereArray.push(this.fb.control(checkbox.value));
    } else {
      const index = critereArray.controls.findIndex(control => control.value === checkbox.value);
      critereArray.removeAt(index);
    }
  }

  getAllEtape(){
    this.loadingIndicator = true;
    this.glogalService.get('etape').subscribe({
      next:(value: Etape[]) =>{        
        this.etape = value;
        this.filteredData = [...value];
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
      }
    })
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

  onAddRowSave(form: UntypedFormGroup) {
    this.loadingIndicator = true;
    this.glogalService.postId('etape',this.currentUserId!, [form.value]).subscribe({
      next: (response) => {
        // Ajouter la nouvelle role reçue à la liste locale
        // Si votre backend renvoie un tableau d'un seul élément (la nouvelle étape),
        // vous devrez peut-être accéder au premier élément ici.
        if (Array.isArray(response) && response.length > 0) {
          this.etape.push(response[0]);
          this.etape = [...this.etape];
        } else if (response) { // Si le backend renvoie directement l'objet
          this.etape.push(response);
          this.etape = [...this.etape];
        }

        // Réinitialiser l'objet salles
        form.reset();
        // Fermer les modales si nécessaire
        this.modalService.dismissAll();
        this.getAllEtape();
        // Afficher un toast de succès
        this.addRecordSuccess();
      },
      error: (err: { status: number; error: any; message?: string }) => {
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
      },
      complete: () => {
        this.loadingIndicator = false;
      }
    });
  }


  // add new record
  addRow(content: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
    });
    // this.register.patchValue({
    //   id: this.getId(10, 100),
    //   img: this.newUserImg,
    // });
  }
  // edit record
  editRow(row: any, rowIndex: number, content: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
    });
    this.editForm.patchValue({
      id: row.id,
      nom: row.nom,
      dateDebut: row.dateDebut,
      dateFin: row.dateFin,
    });

    this.selectedCriteres = []; // Réinitialiser le tableau

    if (row.critere && Array.isArray(row.critere)) {
      this.selectedCriteres = row.critere.map((critere: any) => Number(critere.id));
    }

    const critereArray = this.register.get('critere') as FormArray;
    critereArray.clear(); // Nettoyer le FormArray pour la modification

    this.selectedRowData = row;
  }

  isCritereSelected(critereId: any): boolean {
    return this.selectedCriteres.includes(critereId);
  }

  // delete single row
  deleteSingleRow(row: any) {
    Swal.fire({
      title: 'Voulez vous vraiment supprimer?',
      showCancelButton: true,
      confirmButtonColor: '#000',
      cancelButtonColor: '#fb7823',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: "Annuler"
    }).then((result) => {
      if (result.value) {
        this.deleteRecord(row);
        this.deleteRecordSuccess(1);
      }
    });
  }

  deleteRecord(row: any) {
    this.glogalService.delete("etape", row.id!).subscribe({
      next:(response) =>{
        this.etape = response;
        this.loadingIndicator = true;
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
        this.getAllEtape();

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


  onEditSave(form: UntypedFormGroup) {
    if (form?.value?.id) {
      const critereControl = this.register.get('critere') as FormArray; // Caster explicitement comme FormArray
      const updatedEtape = {
        ...form.value,
        critere: critereControl ? critereControl.value : [] // Utiliser un tableau vide par défaut si le contrôle est null
      };
      console.log('Objet updatedEtape envoyé au backend:', updatedEtape);
      // Préparer l'objet mis à jour (ici l'exemple suppose que `form.value` contient les nouvelles données)
      this.glogalService.updateId("etape", updatedEtape.id,this.currentUserId!, updatedEtape).subscribe({
        next: () => {
          this.modalService.dismissAll(); // Fermer le modal
          this.editRecordSuccess();       // Appeler callback si défini
          setTimeout(() =>{
            this.loadingIndicator = false;
          },500);
          this.getAllEtape();
        },
        error: (err: { status: number; error: any; message?: string }) => {
          console.error('Erreur lors de la mise à jour :', err);

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
      });
    }
  }

  filterDatatable(event: any) {
    const val = event.target.value.toLowerCase();

    this.etape = this.filteredData.filter((item) => {
      return Object.values(item).some((field: any) =>
        field?.toString().toLowerCase().includes(val)
      );
    });

    this.table.offset = 0;
  }

  addRecordSuccess() {
    this.toastr.success('Adjout réalisé avec succès', '');
  }
  editRecordSuccess() {
    this.toastr.success('Modification faite avec succès', '');
  }
  deleteRecordSuccess(count: number) {
    this.toastr.success(count + 'Suppression fait avec succès', '');
  }

  fileUploadSuccess(){
    this.toastr.success("Fichier importer avec succès")
  }


  fileUpload(content: any, etapeId: number, etapeNom: any) {
    this.selectedEtapeId = etapeId;
    this.currentEtapeNom = etapeNom;
    console.log("ID stocké:", this.selectedEtapeId, "Nom stocké:", this.currentEtapeNom);

    this.modalService.open(content, {
      ariaLabelledBy: 'modal-info-title',
      size: 'md',
    });
  }

  onFileSelected(event: any): void {
    this.selectedFile = Array.from(event.target.files);
  }

  /*uploadFiles(toListeDebut: boolean): void {
    if (this.selectedEtapeId === null) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'L\'ID de l\'étape n\'est pas défini.',
        confirmButtonText: 'Ok',
        customClass: { confirmButton: 'bg-red-500 text-white hover:bg-red-600' }
      });
      return;
    }
    if (this.selectedFile.length > 0) {
      this.loadingIndicator = true;
      const uploadPromises = this.selectedFile.map((file) =>
        firstValueFrom(this.glogalService.uploadParticipants(this.selectedEtapeId!, file, toListeDebut))
      );

      Promise.all(uploadPromises)
        .then(() => {
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Tous les fichiers ont été téléchargés avec succès.'
          });
          // Peut-être recharger les données ou fermer le modal ici
          this.modalService.dismissAll();
          this.selectedFile = [];
          this.loadingIndicator = false;
        })
        .catch((err) => {
          Swal.fire({
            icon: 'error',
            title: 'Échec',
            text: 'Une erreur est survenue lors du téléchargement des fichiers.'
          });
          this.loadingIndicator = false;
        });
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Info',
        text: 'Veuillez sélectionner au moins un fichier avant de télécharger.',
        confirmButtonText: 'Ok',
        customClass: { confirmButton: 'bg-red-500 text-white hover:bg-red-600' }
      });
    }
  }*/

  uploadFiles(toListeDebut: boolean): void {
    if (this.selectedEtapeId === null) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'L\'ID de l\'étape n\'est pas défini.',
        confirmButtonText: 'Ok',
        customClass: { confirmButton: 'bg-red-500 text-white hover:bg-red-600' }
      });
      return;
    }

    if (this.selectedFile.length > 0) {
      this.loadingIndicator = true;
      const uploadPromises = this.selectedFile.map((file) =>
        firstValueFrom(this.glogalService.uploadParticipants(this.selectedEtapeId!, file, toListeDebut))
      );

      Promise.all(uploadPromises)
        .then(() => {
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Tous les fichiers ont été téléchargés avec succès.'
          });
          this.modalService.dismissAll();
          this.selectedFile = [];
          this.loadingIndicator = false;
        })
        .catch((error) => {
          this.loadingIndicator = false;

          // Maintenant l'erreur est déjà formatée par le service
          const errorMessage = error.message || 'Une erreur est survenue lors du téléchargement des fichiers.';

          let iconType: 'error' | 'warning' = 'error';
          if (error.status === 403) {
            iconType = 'warning'; // Pour les étapes terminées, utiliser un warning plutôt qu'une erreur
          }

          Swal.fire({
            icon: iconType,
            title: error.status === 403 ? 'Action interdite' : 'Échec',
            text: errorMessage,
            confirmButtonText: 'Ok',
            customClass: {
              confirmButton: error.status === 403
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-red-500 text-white hover:bg-red-600'
            }
          });
        });
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Info',
        text: 'Veuillez sélectionner au moins un fichier avant de télécharger.',
        confirmButtonText: 'Ok',
        customClass: { confirmButton: 'bg-blue-500 text-white hover:bg-blue-600' }
      });
    }
  }

  liste(): void { // Modifier la méthode 'liste' pour ouvrir le modal de ListeGlobale
    this.modalService.open(ListeGlobaleComponent,
      {ariaLabelledBy: 'modal-basic-title',
        size: 'md'
      });
  }
   filterByDebut(row:any){ 
    console.log("Navigating to listeGlobale with debut filter ID", row);
    this.router.navigate(['/listeGlobale'],{ queryParams: { filter: 'debut' } } );
     this.modalService.dismissAll();
    // this.activeModal.close('Filtre début appliqué');
  }

  filterByResultat(row:any){
    this.router.navigate(['/listeGlobale'],{ queryParams: { filter: 'resultat' } } );
    this.modalService.dismissAll();
    // this.activeModal.close('Filtre début appliqué');
  }

openListeDebut(row: any) {
  console.log("Ouverture de la liste de début pour l'étape:", row.listeDebut[0].liste.id);
    sessionStorage.setItem('listeDebut', JSON.stringify(row.listeDebut[0].liste));
    this.router.navigate(['/listeDebut']);
  }

  openListeResultat(row: Liste) {
    sessionStorage.setItem('listeResultat', JSON.stringify(row));
    this.router.navigate(['/listeResultat']);
  }

  // filterByDebut(row:any): void {
  //    console.log("Filtrage par liste de début pour l'étape ID :", row.id);
   
  //     this.listeModalComponent?.filterByDebut();
   
  // }

  // filterByResultat(row:any): void {
   
  //     this.listeModalComponent?.filterByDebut();
    
  // } 
}

export interface selectEtapeInterface {
  nom: string;
  dateDebut: Date;
  dateFin: Date;
  listeDebut?: Participant[]; // Doit être un tableau
  listeResultat?: Participant[]; // Doit être un tableau
  critere: Critere;
}
