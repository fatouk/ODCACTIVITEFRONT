import {ChangeDetectorRef, Component, NgZone, ViewChild} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup, Validators
} from "@angular/forms";
import {FullCalendarModule} from "@fullcalendar/angular";

import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ToastrService} from "ngx-toastr";
import {TypeActivite} from "@core/models/TypeActivite";
import {Activity} from "@core/models/Activity";
import {Entite} from "@core/models/Entite";
import {Salle} from "@core/models/Salle";
import {Etape} from "@core/models/Etape";
import {DatatableComponent, NgxDatatableModule, SelectionType} from "@swimlane/ngx-datatable";
import {GlobalService} from "@core/service/global.service";
import Swal from "sweetalert2";
import {NgForOf, NgIf} from "@angular/common";
import {RouterLink} from "@angular/router";
import {AuthService} from "@core";
import { timer } from 'rxjs';
import { A } from '@angular/cdk/activedescendant-key-manager.d-Bjic5obv';
import { ActivityValidation } from '@core/models/ActivityValidation';
import { Utilisateur } from '@core/models/Utilisateur';
import { co } from '@fullcalendar/core/internal-common';


@Component({
  selector: 'app-activity',
  imports: [
    FormsModule,
    FullCalendarModule,
    ReactiveFormsModule,
    NgIf,
    NgxDatatableModule,
    RouterLink,
    NgForOf,
  ],
  templateUrl: './activity.component.html',
  styleUrl: './activity.component.scss'
})
export class ActivityComponent {
  @ViewChild(DatatableComponent, { static: false }) table!: DatatableComponent;
  rows = [];
  activite:  Activity[] = [];
  entite:  Entite[] = [];
  etape:  Etape[] = [];
  salleId:  Salle[] = [];
  typeActivites:  TypeActivite[] = [];
  selectedEtapes: Etape[] = [];
  scrollBarHorizontal = window.innerWidth < 1200;
  selectedRowData!: selectActiviteInterface;
  filteredData: any[] = [];
  editForm: UntypedFormGroup;
  detailForm: UntypedFormGroup;
  register!: UntypedFormGroup;
  loadingIndicator = true;
  isRowSelected = false;
  reorderable = true;
  public selected: number[] = [];
  useRole: string[];
  validation:ActivityValidation = new ActivityValidation();
  utilisateursPersonnels: Utilisateur[] = [];
  showCommentaire: boolean = false;
  selectedFile: File | null = null;
  currentUserId: number | null = this.getCurrentUserId();
  activityValidation: ActivityValidation = new ActivityValidation();
  columns = [
    { prop: 'nom' },
    { prop: 'titre' },
    { prop: 'lieu' },
    { prop: 'description' },
    { prop: 'dateDebut' },
    { prop: 'dateFin' },
    { prop: 'objectifParticipation' },
  ];

  @ViewChild(DatatableComponent, { static: false }) table2!: DatatableComponent;
  selection!: SelectionType;
  constructor(private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private glogalService: GlobalService,
    private authService: AuthService
  ) {
    this.editForm = this.fb.group({
      id: new UntypedFormControl(),
      nom: new UntypedFormControl(),
      titre: new UntypedFormControl(),
      lieu: new UntypedFormControl(),
      description: new UntypedFormControl(),
      dateDebut: new UntypedFormControl(),
      dateFin: new UntypedFormControl(),
      objectifParticipation: new UntypedFormControl(),
      entite: new UntypedFormControl(),
      salleId: new UntypedFormControl(),
      //typeId: new UntypedFormControl(),
      typeActivite: new UntypedFormControl(),
      etape: new UntypedFormControl(),
      selectedEtapeIds: new UntypedFormControl(),
      commentaire: new UntypedFormControl(),
      superviseurId: new UntypedFormControl(),
      fichier: new UntypedFormControl(),
      fichierjoint: new UntypedFormControl(),
    });
     this.detailForm = this.fb.group({
      id: new UntypedFormControl(),
      nom: new UntypedFormControl(),
      titre: new UntypedFormControl(),
      lieu: new UntypedFormControl(),
      description: new UntypedFormControl(),
      dateDebut: new UntypedFormControl(),
      dateFin: new UntypedFormControl(),
      objectifParticipation: new UntypedFormControl(),
      entite: new UntypedFormControl(),
      salleId: new UntypedFormControl(),
      //typeId: new UntypedFormControl(),
      typeActivite: new UntypedFormControl(),
      etape: new UntypedFormControl(),
      selectedEtapeIds: new UntypedFormControl(),
      commentaire: new UntypedFormControl(),
      superviseurId: new UntypedFormControl(),
      fichier: new UntypedFormControl(),
      fichierjoint: new UntypedFormControl(),
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
    console
    Swal.fire({
      title: 'Voulez vous vraiment supprimer?',
      showCancelButton: true,
      confirmButtonColor: '#8963ff',
      cancelButtonColor: '#fb7823',
      confirmButtonText: 'Oui',
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
    this.getAllEntite();
    this.getAllActivite();
    this.getAllTypeActivite();
    this.getAllSalle();  
    this.getAllUtilisateur();
  // initialize form group
   this.register = this.fb.group({
      id: [''],
      nom: ['', [Validators.required]],
      titre: ['', [Validators.required]],
      lieu: ['', [Validators.required]],
      description: ['', [Validators.required]],
      dateDebut: ['', [Validators.required]],
      dateFin: ['', [Validators.required]],
      objectifParticipation: [null, [Validators.required]],
      entite: [null, [Validators.required]],
      //etape: [null, [Validators.required]],
      salleId: [null, [Validators.required]],
      //typeId: [null, [Validators.required]],
      typeActivite: [null, [Validators.required]],
      superviseurId: [null],
      commentaire: [''],
      fichier: [null],
      fichierjoint: [''],
    });
     this.detailForm = this.fb.group({
      id: [''],
      nom: [{ value: this.selectedRowData.nom, disabled: true }, [Validators.required]],      titre: ['', [Validators.required]],
      lieu: ['', [Validators.required]],
      description: ['', [Validators.required]],
      dateDebut: ['', [Validators.required]],
      dateFin: ['', [Validators.required]],
      objectifParticipation: [null, [Validators.required]],
      entite: [null, [Validators.required]],
      etape: [null, [Validators.required]],
      salleId: [null, [Validators.required]],
      typeId: [null, [Validators.required]],
      typeActivite: [null, [Validators.required]],
      superviseurId: [null],
      commentaire: [''],
      fichier: [null],
      fichierjoint: [''],
    });
  }

  // fetch data
 getAllUtilisateur(){
    this.loadingIndicator = true;
    this.glogalService.get('utilisateur').subscribe({
      next:(value: Utilisateur[]) =>{
        this.utilisateursPersonnels = value;
        console.log("Users",this.utilisateursPersonnels)

        this.filteredData = [...value];
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
      }
    })
  }

  getAllActivite(){
    this.loadingIndicator = true;
    this.glogalService.get('activite').subscribe({
      next:(value: Activity[]) =>{
          console.log("Activites :", value)
        this.activite = value;
        this.filteredData = [...value];
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
      }
    })
  }
 
  getAllEntite(){
    this.loadingIndicator = true;     
    this.glogalService.get('entite').subscribe({
      next:(value: Entite[]) =>{
        this.entite = value;
        this.filteredData = [...value];
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
         console.log("Entite :", this.entite)
      }
    })
  }

  getAllSalle(){
    this.loadingIndicator = true;
    this.glogalService.get('salle').subscribe({
      next:(value: Salle[]) =>{
        this.salleId = value;
        this.filteredData = [...value];
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
      }
    })
  }

  getAllEtape(){
    this.loadingIndicator = true;
    this.glogalService.get('etape').subscribe({
      next:(value: Etape[]) =>{
        console.log("Etape :=================", value)
        this.etape = value;
        this.filteredData = [...value];
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
      }
    })
  }

  getAllTypeActivite(){
    this.loadingIndicator = true;
    this.glogalService.get('typeActivite').subscribe({
      next:(value: TypeActivite[]) =>{
        this.typeActivites = value;
        console.log("Type Activite :", this.typeActivites)
        this.filteredData = [...value];
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
      }
    })
  }

//   async onAddRowSave(form: UntypedFormGroup) {
//     this.loadingIndicator = true;    
//        console.log('Response ajout activite',form.value)
//       await this.glogalService.post('activite', form.value).subscribe({
//       next: (response) => {
//         // Ajouter la nouvelle activite
//        this.activite.push(response);
//         console.log("Activite crée======",response)
//          this.onAddRowSaveValidation(form,response);
             
//         // Réinitialiser le formulaire
//         form.reset();
//         // Fermer les modales si nécessaire
//         this.modalService.dismissAll();   
//         // Afficher un toast de succès
//       //  this.addRecordSuccess();
//         this.addSuccessMessage(3000);
       
//          // Recharger directement la liste complète des activités depuis le backend
//         this.reloadActivities();
//       },
//       error: (err: { status: number; error: any; message?: string }) => {
//         console.error('Erreur reçue:', err);
//         let message = 'Une erreur est survenue. Veuillez réessayer.';
//         let title = '<span class="text-red-500">Échec</span>';
//         if (err.error?.message) {
//           message = err.error.message;
//         } else if (err.message) {
//           message = err.message;
//         }
//         Swal.fire({
//           icon: 'error',
//           title: title,
//           text: message,
//           confirmButtonText: 'Ok',
//           customClass: {
//             confirmButton: 'bg-red-500 text-white hover:bg-red-600',
//           },
//         });
//       },
//       complete: () => {
//         this.loadingIndicator = false;
//       }
//     });
//   }

  onAddRowSaveValidation(form: UntypedFormGroup,value:ActivityValidation) {
  
  this.glogalService.createValidation(value).subscribe({
    next: (activite) => {
      console.log("Activitevalidtaion crée ", activite);
      }});
    
      error: (err:any) => {
      console.error('Erreur Activitevalidtaion', err);
      this.loadingIndicator = false;}
}

  async onAddRowSaveOld(form: UntypedFormGroup) {
  if (form.invalid) return;
  this.loadingIndicator = true;
  const activiteData = { ...form.value };

  // Créer l'Activite
  this.glogalService.post('activite', activiteData).subscribe({
    next: (activite: Activity) => {
      console.log("Activite crée ", activite);

      // Créer la Validation en utilisant l'ID de l'Activite créé
      const validation: ActivityValidation = {
        activiteId: activite.id,
        superviseurId: form.value.superviseurId,
        commentaire: form.value.commentaire,
        statut: 'En_Attente',
        fichierjoint: form.value.fichierjoint || null
      };

      const fichier: File | undefined = form.value.fichier;

      this.glogalService.createValidation(validation, fichier).subscribe({
        next: () => {
          this.addRecordSuccess();
          this.modalService.dismissAll();
          form.reset();
          this.reloadActivities();
        },
        error: (err) => console.error('Erreur validation', err),
        complete: () => this.loadingIndicator = false
      });
    },
    error: (err) => {
      console.error('Erreur activité', err);
      this.loadingIndicator = false;
    }
  });
}
async onAddRowSaveOld2(form: UntypedFormGroup) {
  if (form.invalid) return;
  this.loadingIndicator = true;
  const activiteData = { ...form.value };
  //  Créer l'Activite
  this.glogalService.post('activite', form.value).subscribe({
    next: (activite: Activity) => {
      console.log("Activite crée ==", activite);

      //  Créer la Validation uniquement si un superviseur est sélectionné
       if (form.value.fichierjoint) {
        this.activityValidation.fichierjoint = form.value.fichierjoint;
       }
      if(form.value.superviseurId) {
        const validation: ActivityValidation = {
          activiteId: activite.id,
          superviseurId: form.value.superviseurId,
          commentaire: form.value.commentaire || null, // facultatif
          statut: 'En_Attente',
          fichierjoint: this.activityValidation.fichierjoint // facultatif
        };

        const fichier: File | undefined = form.value.fichier;
      //CREATION DE ACTIVITYVALIDATION
        this.glogalService.createValidation(validation, fichier).subscribe({
          next: () => {
            this.addRecordSuccess();
            this.modalService.dismissAll();
            form.reset();
            this.reloadActivities();
          },
          error: (err) => console.error('Erreur validation', err),
          complete: () => this.loadingIndicator = false
        });
      } else {
        // Pas de superviseur => pas de validation, juste succès Activite
        this.addRecordSuccess();
        this.modalService.dismissAll();
        form.reset();
        this.reloadActivities();
        this.loadingIndicator = false;
      }
    },
    error: (err) => {
      console.error('Erreur activité', err);
      this.loadingIndicator = false;
    }
  });
}

getCurrentUserId(): number | null {
  const raw = localStorage.getItem('bearerid');
  console.log('Raw currentUser from localStorage:', raw);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    // si le stockage est juste un id string, parsed sera une string
    if (typeof parsed === 'number') return parsed;
    if (typeof parsed === 'string') return parseInt(parsed, 10);
    // sinon on cherche parsed.id
    if (parsed ) return Number(parsed);
    return null;
  } catch {
    // raw n'était pas JSON (peut être un id en string)
    const val = parseInt(raw, 10);
    return isNaN(val) ? null : val;
  }
}
// CREATION NOVELLE ACTIVITE AVEC OU SANS VALIDATION
async onAddRowSave(form: UntypedFormGroup) {
  if (form.invalid) return;
  this.loadingIndicator = true;

  // Étape 1 : Création de l'activité
  this.glogalService.post('activite', form.value).subscribe({
    next: (activite: Activity) => {
      console.log("✅ Activité créée :", activite);

      // Vérifie si un superviseur est sélectionné
      const superviseurId = form.value.superviseurId;
      const fichierjoint = form.value.fichierjoint || null;

      if (superviseurId) {
        console.log(" Création de validation pour superviseur :", superviseurId);

        // Prépare la validation
        const validation: ActivityValidation = {
          envoyeurId: this.getCurrentUserId() || undefined,
          activiteId: activite.id,
          superviseurId,
          commentaire: form.value.commentaire || null,
          statut: 'En_Attente',
          fichierjoint
        };

        const fichier: File | undefined = form.value.fichier;

        // Étape 2 : Création de la validation
        this.glogalService.createValidation(validation, fichier).subscribe({
          next: () => {
            console.log(" Validation créée !");
            this.addRecordSuccess();
            this.modalService.dismissAll();
            this.reloadActivities();
            form.reset();
          },
          error: (err) => {
            console.error("Erreur validation :", err);
            this.loadingIndicator = false;
          },
          complete: () => {
            this.loadingIndicator = false;
          }
        });
      } else {
        // Pas de superviseur sélectionné, on saute la création de validation
        this.addRecordSuccess();
        this.modalService.dismissAll();
        this.reloadActivities();
        form.reset();
        this.loadingIndicator = false;
      }
    },
    error: (err) => {
      console.error("❌ Erreur activité :", err);
      this.loadingIndicator = false;
    }
  });
}

addSuccessMessage(duration: number = 3000) {
  Swal.fire({
    icon: 'success',
    title: 'Succès',
    text: 'L’activité a été ajoutée avec succès !',
    showConfirmButton: false,
    timer: duration,
    timerProgressBar: true,
  }); 
}
reloadActivities() {
  this.glogalService.get('activite').subscribe({
    next: (data) => {
      this.activite = Array.isArray(data) ? data : [];
      this.loadingIndicator = false;
      this.cdr.detectChanges(); // force Angular à rafraîchir l'affichage
    },
    error: (err) => {
      this.loadingIndicator = false;
      console.error('Erreur lors du rechargement des activités :', err);
    },
  });
}
  // add new record
  addRow(content: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
    });
  
  }

  selectedEtapeIds: number[] = [];
  
 detailRow(row: any, rowIndex: number, content: any) {
    this.getAllEtape();
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
    });
    // Préparer les IDs d'étapes sélectionnées
   // this.selectedEtapeIds = row.etapes?.map((e: any) => e.id) || []; // Notez: 'etapes' au lieu de 'etape'
//code fatou, pour verifier si l'etape est un tableau ou un objet et si c'est null
   const etapes = Array.isArray(row.etapes)
  ? row.etapes
  : row.etapes
    ? [row.etapes]
    : [];

this.selectedEtapeIds = etapes.map((e: any) => e.id);
    this.detailForm.patchValue({
      id: row.id,
      nom: row.nom,
      titre: row.titre,
      lieu: row.lieu,
      description: row.description,
      dateDebut: row.dateDebut,
      dateFin: row.dateFin,
      objectifParticipation: row.objectifParticipation,
      entite: row.entite?.id,
      etape: this.selectedEtapeIds, // Utiliser directement selectedEtapeIds
      salleId: row.salleId?.id,
      typeActivite: row.typeActivite?.id,
    });
// console.log("selectedEtapeIds au niveau composant :", this.selectedEtapeIds);

    this.selectedRowData = row;
  }
  editRow(row: any, rowIndex: number, content: any) {
    this.getAllEtape();
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
    });
    // Préparer les IDs d'étapes sélectionnées
   // this.selectedEtapeIds = row.etapes?.map((e: any) => e.id) || []; // Notez: 'etapes' au lieu de 'etape'
//code fatou, pour verifier si l'etape est un tableau ou un objet et si c'est null
   const etapes = Array.isArray(row.etapes)
  ? row.etapes
  : row.etapes
    ? [row.etapes]
    : [];

this.selectedEtapeIds = etapes.map((e: any) => e.id);
    this.editForm.patchValue({
      id: row.id,
      nom: row.nom,
      titre: row.titre,
      lieu: row.lieu,
      description: row.description,
      dateDebut: row.dateDebut,
      dateFin: row.dateFin,
      objectifParticipation: row.objectifParticipation,
      entite: row.entite?.id,
      etape: this.selectedEtapeIds, // Utiliser directement selectedEtapeIds
      salleId: row.salleId?.id,
      typeActivite: row.typeActivite?.id,
    });
// console.log("selectedEtapeIds au niveau composant :", this.selectedEtapeIds);

    this.selectedRowData = row;
  }
  onEditSave(form: UntypedFormGroup) {
    console.log("modification", form.value);
    if (form?.value?.id) {
      // Utiliser les IDs sélectionnés directement depuis selectedEtapeIds
      const etapesObjects = (this.selectedEtapeIds || []).map((id: number) => ({ id }));

      // Créer l'objet à envoyer au backend
      const updatedActivite = {
        ...form.value,
        etapes: etapesObjects,
      };

      this.glogalService.update("activite", updatedActivite.id, updatedActivite).subscribe({
        next: () => {
          this.modalService.dismissAll();
          this.editRecordSuccess();
          setTimeout(() => {
            this.loadingIndicator = false;
          }, 500);
          this.getAllActivite();
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
onFileSelected(event: any): void {
  const file = event.target.files[0];
  if (file) {
    this.selectedFile = file;
    this.register.patchValue({ fichier: file });
    this.register.get('fichier')?.updateValueAndValidity();
    console.log('Fichier sélectionné :', file.name);
  }
}
onSuperviseurSelected(event: any) {
  const superviseurId = event.target.value;

  if (superviseurId) {
    // Stocker l’ID sélectionné dans le form
    this.register.patchValue({ superviseurId });

    // Afficher le champ commentaire (tu peux gérer ça via un booléen)
    this.showCommentaire = true;
  } else {
    // Si aucun superviseur choisi, on masque le champ commentaire
    this.showCommentaire = false;
    this.register.patchValue({ superviseurId: null, commentaire: '' });
  }
}

// VERSION CORRIGÉE - Ne pas mettre à jour le formulaire dans onEtapesChange
  onEtapesChange(selectedIds: number[]) {
    console.log('Etapes sélectionnées ont changé:', selectedIds);
    // Seulement mettre à jour la variable, PAS le formulaire
    this.selectedEtapeIds = selectedIds;

    // Si vous avez besoin de faire quelque chose d'autre avec les étapes filtrées
    const filteredEtapes = this.etape.filter(etape =>
      etape && selectedIds.includes(etape.id!)
    );

    console.log('Etapes filtrées:', filteredEtapes);

    // NE PAS FAIRE CECI - cela cause la récursion infinie :
    // this.editForm.patchValue({ etape: selectedIds });
  }


  // delete single row
  deleteSingleRow(row: any) {
    Swal.fire({
      title: 'Voulez vous vraiment supprimer?',
      showCancelButton: true,
      confirmButtonColor: '#8963ff',
      cancelButtonColor: '#fb7823',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.value) {
        this.deleteRecord(row);
        this.deleteRecordSuccess(1);
      }
    });
  }

 

  deleteRecord(row: any) {
    // Activer le loading pendant la suppression
    this.loadingIndicator = true;

    // this.glogalService.delete("activite", row.id!).subscribe({
      this.glogalService.delete("activite", row!).subscribe({
      next: (response: any) => {
        console.log('Réponse de suppression:', response);

        // Succès de la suppression
        Swal.fire({
          icon: 'success',
          title: 'Supprimé !',
          text: 'L\'activité a été supprimée avec succès.',
          timer: 2000,
          showConfirmButton: false
        });

        // Recharger la liste des activités
        this.getAllActivite();

        // Désactiver le loading après un délai
        setTimeout(() => {
          this.loadingIndicator = false;
        }, 500);
      },
      error: (err) => {
        console.log('Erreur de suppression:', err);

        // Extraire le message d'erreur
        const msg = this.glogalService.extractMessageFromError(err);

        // Désactiver le loading en cas d'erreur
        this.loadingIndicator = false;

        // Afficher l'erreur
        Swal.fire({
          icon: 'error',
          title: 'Erreur de suppression',
          text: msg,
          confirmButtonText: 'OK'
        });
      }
    });
  }


  filterDatatable(event: any) {
    const val = event.target.value.toLowerCase();

    this.activite = this.filteredData.filter((item) => {
      return Object.values(item).some((field: any) =>
        field?.toString().toLowerCase().includes(val)
      );
    });

    this.table.offset = 0;
  }



  addRecordSuccess() {
    this.toastr.success('Adjout réalisé avec succès.', '');
  }
  editRecordSuccess() {
    this.toastr.success('Modification opéré', '');
  }
  deleteRecordSuccess(count: number) {
    this.toastr.error(count + 'Suppresion faite avec succès.', '');
  }

//News fonctions pour la gestion du select
// isSelected(row: any): boolean {
//   this.isRowSelected = this.selected.length > 0;
//    return this.selected.some(r => r === row.id);
//   //  this.selected.splice(0, this.selected.length);
//   //   this.selected.push(...this.selected);

//   //   if (this.selected.length === 0) {
//   //     this.isRowSelected = false;
//   //   } else {
//   //     this.isRowSelected = true;
//   //   }
//   //   return this.selected.includes(row.id);
// }
// toggleSelection(row: any, event: any) {
//   if (event.target.checked) {
//     this.isRowSelected = true;
//     this.selected.push(row);
//   } else {
//     this.selected = this.selected.filter(r => r !== row.id);
//   }
//   this.isRowSelected = this.selected.length > 0;
// }
toggleSelection(row: any, event: any) {
  const checked = (event.target as HTMLInputElement).checked;

  if (checked) {
    console.log("Ajout de l'ID sélectionné :", row.id);
    if (!this.selected.includes(row.id)) {
      this.selected.push(row.id);
      console.log("Liste des IDs sélectionnés :", this.selected);
    }
  } else {
    this.selected = this.selected.filter(id => id !== row.id);
    console.log("Liste des IDs après suppression :", this.selected);
  }

  this.isRowSelected = this.selected.length > 0;
}

isSelected(row: any): boolean {
    return this.selected.includes(row.id);
}
onRowCheckboxChange(row: any, event: any) {
  if (event.target.checked) {
    this.isRowSelected = true;
    this.selected = [...this.selected, row];
  } else {
    this.isRowSelected = false;
    this.selected = this.selected.filter((r) => r.toFixed !== row.id);
  
}
}}
export interface selectActiviteInterface {
  nom: string;
  titre: string;
  lieu: string;
  description: string;
  dateDebut: Date;
  dateFin: Date;
  objectifParticipation: number;
  entite: Entite;
  etape: Etape;
  salleId: Salle;
  typeActivite: TypeActivite;
}

