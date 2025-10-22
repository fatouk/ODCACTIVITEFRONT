import { ChangeDetectorRef, Component, NgZone, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule,
  ReactiveFormsModule, } from '@angular/forms';
import { AuthService } from '@core';
import { ActivityValidation } from '@core/models/ActivityValidation';
import { Utilisateur } from '@core/models/Utilisateur';
import { GlobalService } from '@core/service/global.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DatatableComponent, SelectionType, NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { TypeActivite } from '@core/models/TypeActivite';
import { Salle } from '@core/models/Salle';
import { Etape } from '@core/models/Etape';
import { Entite } from '@core/models/Entite';
import { Activity } from '@core/models/Activity';
import Swal from 'sweetalert2';
import { C } from '@angular/cdk/scrolling-module.d-ud2XrbF8';
import { co } from '@fullcalendar/core/internal-common';
import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/module.d-CnjH8Dlt';
@Component({
  selector: 'app-activityvalidation',
  imports: [NgxDatatableModule, CommonModule,ReactiveFormsModule, FormsModule],
  templateUrl: './activityvalidation.component.html',
  styleUrl: './activityvalidation.component.scss'
})
export class ActivityvalidationComponent {
  // Variables
    @ViewChild(DatatableComponent, { static: false }) table2!: DatatableComponent;
  selection!: SelectionType;
   @ViewChild(DatatableComponent, { static: false }) table!: DatatableComponent;
  rows = [];
  activite:  Activity[] = [];
  activiteval:  Activity[] = [];
  activitesEnAttente: Activity[] = [];
  activitevalidation: ActivityValidation[] = [];
  superviseurMap: Record<number, string> = {};
  entite:  Entite[] = [];
  etape:  Etape[] = [];
  salleId:  Salle[] = [];
  typeActivites:  TypeActivite[] = [];  
  scrollBarHorizontal = window.innerWidth < 1200;
  selectedRowData!: selectActiviteInterface;
  filteredData: any[] = [];
  editForm?: UntypedFormGroup;
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
  activityValidation: ActivityValidation = new ActivityValidation();
  selectedActivite?: Activity = new Activity();
  @ViewChild('validationModal') validationModal: any;
  validationForm!: UntypedFormGroup;
  //Constructeur
  constructor(private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private glogalService: GlobalService,
    private authService: AuthService) {
       window.onresize = () => {
      this.scrollBarHorizontal = window.innerWidth < 1200;
    };
    this.selection = SelectionType.checkbox;

    this.useRole = this.authService.getCurrentUserFromStorage().roles;
    console.log('Roles utilisateur dans ActivityValidationComponent:', this.useRole);
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
    this.getAllEntite();
    this.getAllActivite();
    this.getAllTypeActivite();
    this.getAllSalle();  
    this.getAllUtilisateur();
    this.getMapSuperviseur();
    this.getActivitesForSuperviseur();
    this.getCurrentUserId();
    
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
getMapSuperviseur(): void {
  this.glogalService.get('utilisateur').subscribe({
    next: (data) => {
      this.superviseurMap = Object.fromEntries(
        data.map((s: any) => [s.id, s.nom+'-'+s.prenom])
      );
      console.log('SuperviseurMap chargée :', this.superviseurMap);
    },
    error: (err) => {
      console.error('Erreur lors du chargement des superviseurs', err);
    }
  });
}
  getAllActivite(){
    this.loadingIndicator = true;
    this.glogalService.get('activite').subscribe({
      next:(value: Activity[]) =>{
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

 onAddRowSaveValidation(form: UntypedFormGroup,value:ActivityValidation) {
  
  this.glogalService.createValidation(value).subscribe({
    next: (activite) => {
      console.log("Activite crée ", activite);
      }});
    
      error: (err:any) => {
      console.error('Erreur activité', err);
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
async onAddRowSave(form: UntypedFormGroup) {
  if (form.invalid) return;
  this.loadingIndicator = true;
  const activiteData = { ...form.value };

  //  Créer l'Activite
  this.glogalService.post('activite', activiteData).subscribe({
    next: (activite: Activity) => {
      console.log("Activite crée ==", activite);

      //  Créer la Validation uniquement si un superviseur est sélectionné
       if (form.value.fichierjoint) {
        this.activityValidation.fichierjoint = form.value.fichierjoint;
       }
      if (form.value.superviseurId) {
        const validation: ActivityValidation = {
          activiteId: activite.id,
          superviseurId: form.value.superviseurId,
          commentaire: form.value.commentaire || null, // facultatif
          statut: 'En_Attente',
          fichierjoint: this.activityValidation.fichierjoint // facultatif
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

downloadOrOpenFile(validationId: number, openInNewTab = false) {
  this.glogalService.getValidationFileResponse(validationId).subscribe({
    next: (resp) => {
      const blobf = resp.body;
      const contentDisp = resp.headers.get('content-disposition') || '';
      const match = /filename="?([^"]+)"?/.exec(contentDisp);
      const filename = match ? match[1] : 'fichier.bin';

      const url = window.URL.createObjectURL(blobf!);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    error: (err) => console.error('Erreur téléchargement :', err)
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
editSuccessMessage(duration: number = 3000) {
  Swal.fire({
    icon: 'success',
    title: 'Succès',
    text: 'L’activité a été modifiée avec succès !',
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
reloadActivitieValidations() {
  this.glogalService.get('activitevalidation').subscribe({
    next: (data) => {
      this.activitevalidation = Array.isArray(data) ? data : [];
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
  

  editRow(row: any, rowIndex: number, content: any) {
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
    // this.editForm.patchValue({
    //   id: row.id,
    //   nom: row.nom,
    //   titre: row.titre,
    //   lieu: row.lieu,
    //   description: row.description,
    //   dateDebut: row.dateDebut,
    //   dateFin: row.dateFin,
    //   objectifParticipation: row.objectifParticipation,
    //   entite: row.entite?.id,
    //   etape: this.selectedEtapeIds, // Utiliser directement selectedEtapeIds
    //   salleId: row.salleId?.id,
    //   typeActivite: row.typeActivite?.id,
    // });

    this.selectedRowData = row;
  }
  editRow2(row:any,editRecord:any){
    this.selectedActivite=row;
    this.modalService.open(editRecord, {
      ariaLabelledBy: 'modal-basic-title',});
      this.selectedRowData = row;
      console.log("edit row",row);
    };
    editRowValidation(row:any,validationRecord:any){
      console.log("validation row",row);
      this.selectedActivite=row;
    this.validationForm = this.fb.group({
      statut: ['', Validators.required],      // Acceptee ou Rejetee
      superviseurId: [''],                           // Optionnel
      commentaire: [''],                           // Optionnel
      fichierjoint: [null],                             // Optionnel
    });

    this.modalService.open(this.validationModal, { size: 'lg', centered: true });
  }
// Save validation by activity
onValidate() {
    if (this.validationForm.invalid) {
      this.validationForm.markAllAsTouched();
      return;
    }
    const fichierChiffre  = this.selectedFile || null;
    const fichierjoint = this.selectedFile?.name || null;
    console.log("fichier joint", fichierjoint);
    console.log("fichier chiffre", fichierChiffre);
    const formData = new FormData();
    const validation: ActivityValidation = {
      activiteId: this.selectedActivite?.id,
      statut: this.validationForm.value.statut,
      superviseurId: this.validationForm.value.superviseurId || undefined,
      commentaire: this.validationForm.value.commentaire || undefined,
     fichierjoint: fichierjoint || undefined,
     fichierChiffre:fichierChiffre || undefined
    };

    
    this.glogalService.createValidation(validation,fichierChiffre!).subscribe({
      next: () => {
        this.modalService.dismissAll();
        this.editSuccessMessage(3000);
        this.reloadActivities();
        this.reloadActivitieValidations();
      },
      error: (err) => console.error('Erreur validation :', err),
    });
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
     this.validationForm.patchValue({ superviseurId });

    // Afficher le champ commentaire (tu peux gérer ça via un booléen)
    this.showCommentaire = true;
  } else {
    // Si aucun superviseur choisi, on masque le champ commentaire
    this.showCommentaire = false;
    this.register.patchValue({ superviseurId: null, commentaire: '' });
  }
}

onSuperviseurSelectedVal(event: any) {
  const superviseurId = event.target.value;

  if (superviseurId) {
    // Stocker l’ID sélectionné dans le form
      this.validationForm.patchValue({ superviseurId });

    // Afficher le champ commentaire (tu peux gérer ça via un booléen)
    this.showCommentaire = true;
  } else {
    // Si aucun superviseur choisi, on masque le champ commentaire
    this.showCommentaire = false;
    this.validationForm.patchValue({ superviseurId: null, commentaire: '' });
  }
}
onFileSelectedVal(event: any): void {
  const file = event.target.files[0];
  if (file) {
    this.selectedFile = file;
    this.validationForm.patchValue({ fichier: file });
    this.validationForm.get('fichier')?.updateValueAndValidity();
    console.log('Fichier sélectionné :', file.name);
  }
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
// 🔹 toutes les activités où je suis superviseur
getActivitesForSuperviseur() {
    const id = this.getCurrentUserId();
    console.error('ID utilisateur trouvé dans le stockage local:', id);
  if (id === null) {
    console.error('ID utilisateur non trouvé dans le stockage local.');
    return;
  }
  this.glogalService.getActivitesBySuperviseur(id).subscribe({
    next: (data) => {
      this.activiteval = data;
      console.log('Toutes mes activités :', data);
    },
    error: (err) => console.error('Erreur getActivitesBySuperviseur:', err)
  });
}
getActivitesEnAttenteForSuperviseur() {
    const id = this.getCurrentUserId();
  if (id === null) {
    console.error('ID utilisateur non trouvé dans le stockage local.');
    return;
  }
  // 🔹 seulement celles en attente
  this.glogalService.getActivitesEnAttenteBySuperviseur(id).subscribe({
    next: (data) => {
      this.activitesEnAttente = data;
      console.log('Activités en attente :', data);
    },
    error: (err) => console.error('Erreur getActivitesEnAttenteBySuperviseur:', err)
  });
}

  deleteRecord(row: any) {
    // Activer le loading pendant la suppression
    this.loadingIndicator = true;

    this.glogalService.delete("activite", row.id!).subscribe({
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

}

export interface selectActiviteInterface {
  id?: number | undefined
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
  activitevalidation: ActivityValidation[];
}


