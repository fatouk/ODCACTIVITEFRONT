import { Component } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup, Validators
} from "@angular/forms";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {Router, RouterLink} from "@angular/router";
import {Entite} from "@core/models/Entite";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ToastrService} from "ngx-toastr";
import {GlobalService} from "@core/service/global.service";
import {Utilisateur} from "@core/models/Utilisateur";
import {NgForOf, NgIf} from "@angular/common";
import Swal from "sweetalert2";
import {TypeActivite} from "@core/models/TypeActivite";
import {EncryptionService} from "@core/service/encryption.service";

@Component({
  selector: 'app-entite',
  imports: [
    FormsModule,
    NgxDatatableModule,
    ReactiveFormsModule,
    RouterLink,
    NgForOf,
    NgIf
  ],
  templateUrl: './entite.component.html',
  styleUrl: './entite.component.scss'
})
export class EntiteComponent {
  rows = [];
  entite:  Entite[] = [];
  users:  Utilisateur[] = [];
  selectedFile: File | null = null;
  selectedUtilisateur: Utilisateur | null = null; // Déclaration de la variable pour stocker l'utilisateur sélectionné
  allTypeActivite: TypeActivite[] = []; // Pour la liste déroulante des types d'activités
  selectedTypeActivites: number[] = []; // Pour stocker les IDs des types d'activités sélectionnés
  utilisateursPersonnels: any[] = [];
  currentYear: number = new Date().getFullYear();
  activiteCount: { [key: number]: number } = {}
  scrollBarHorizontal = window.innerWidth < 1200;
  selectedRowData!: selectEntiteInterface;
  filteredData: any[] = [];
  editForm: UntypedFormGroup;
  register!: UntypedFormGroup;
  loadingIndicator = true;
  isRowSelected = false;
  reorderable = true;
  public selected: number[] = [];
  columns = [
    { prop: 'nom' }
  ];

  constructor(
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private glogalService: GlobalService,
    private router: Router,
    private encryptionService: EncryptionService // Injectez le service
  ) {
    this.editForm = this.fb.group({
      id: new UntypedFormControl(),
      nom: new UntypedFormControl(),
      description: new UntypedFormControl(),
      logo: new UntypedFormControl(),
      responsable: new UntypedFormControl(),
      allTypeActivite: new UntypedFormControl(),
    });
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

 /* viewEntiteDetails(entite: Entite): void {
    const encryptedId = this.encryptionService.encrypt(entite.id ? entite.id.toString() : '');
    this.router.navigate([`admin/entiteDetail/${encryptedId}`]);
  }*/

  viewEntiteDetails(entite: Entite): void {
    this.router.navigate(['/entiteDetail'], {
      state: { entiteId: entite.id }
    });
    console.log("Entite", entite.id)
  }


  ngOnInit() {
    this.getAllEntite();
    this.getAllUtilisateur();
    this.getAllTypeActivite();
    this.register = this.fb.group({
      id: [''],
      nom: ['', [Validators.required]],
      description: ['', [Validators.required]],
      logo: [''],
      // responsable: [null, [Validators.required]],
      responsable: [null], // Permet de ne pas forcer la sélection d'un responsable
      typeActivite: [null],
      // typeActivite: [null, [Validators.required]], // Ajoutez ce FormControl pour correspondre à formControlName
      selectedTypeActivites: [null], // Vous utilisez déjà selectedTypeActivites pour stocker les IDs

    });
  }

  getAllEntite(){
    this.loadingIndicator = true;
    this.glogalService.get('entite').subscribe({
      next:(value: Entite[]) =>{
        this.entite = value;
        this.filteredData = [...value];

        // Charger le nombre d'activités pour chaque entité
        this.loadActiviteCountFromAllActivites();
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
      }
    })
  }

  getAllUtilisateur(){
    this.glogalService.get('utilisateur').subscribe({
      next:(value: Entite[]) =>{
        this.users = value;
      }
    })
  }

  getAllTypeActivite(): void {
    this.glogalService.get("typeActivite").subscribe({
      next: (data: TypeActivite[]) => {
        this.allTypeActivite = data;
      },
      error: (err) => {
        console.error("Erreur lors de la récupération des types d'activités", err);
      }
    });
  }

  onAddRowSave(form: UntypedFormGroup) {
    this.loadingIndicator = true;
    const formData = new FormData();
    // Ajouter les données de l'entité depuis le formulaire
    formData.append('entiteOdc', new Blob([JSON.stringify(form.value)], { type: 'application/json' }));

    // Ajouter le fichier si présent
    if (this.selectedFile) {
      formData.append('logo', this.selectedFile);
    }

    // Ajouter les types d’activités sélectionnés
    // this.selectedTypeActivites.forEach(typeId => {
    //   formData.append('typeActiviteIds', typeId.toString());
    // });
    const selectedActivityIds: number[] = this.register.get('typeActivite')?.value || [];
    selectedActivityIds.forEach(typeId => {
      formData.append('typeActiviteIds', typeId.toString());
    });

    const selectedUserId: number = this.register.get('responsable')?.value;

    if (!selectedUserId) {
      this.loadingIndicator = false;
      Swal.fire({
        icon: 'info',
        title: '<span class="text-orange-500">Info</span>',
        text: 'Aucun utilisateur sélectionné ou ID non disponible.',
        confirmButtonText: 'Ok',
        customClass: {
          confirmButton: 'bg-red-500 text-white hover:bg-red-600',
        },
      });
      return;
    }

    formData.append('utilisateurId', selectedUserId.toString());

    // formData.append('utilisateurId', this.selectedUtilisateur.id.toString());
    this.glogalService.post('entite', formData).subscribe({
      next: (response) => {
        // Ajouter la nouvelle role reçue à la liste locale
        console.log(response)
        this.entite.push(response);
        this.entite = [...this.entite];

        // Réinitialiser l'objet salles
        form.reset();
        // Fermer les modales si nécessaire
        this.modalService.dismissAll();

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

  onCreateSave(form: UntypedFormGroup) {
  if (!form.valid) return;

  this.loadingIndicator = true;
  const formData = new FormData();

  const newEntite = {
    nom: form.value.nom,
    description: form.value.description,
    responsableId: form.value.responsable?.id || null,
    typeActiviteIds: form.value.typeActivite || [],
  };

  // ✅ correspond à @RequestPart("entite")
  formData.append(
    'entite',
    new Blob([JSON.stringify(newEntite)], { type: 'application/json' })
  );

  // ✅ correspond à @RequestPart("fichier")
  if (this.selectedFile) {
    formData.append('fichier', this.selectedFile, this.selectedFile.name);
  }

  this.glogalService.post('entite',formData).subscribe({
    next: () => {
      this.loadingIndicator = false;
      this.modalService.dismissAll();
     this.addRecordSuccess();
    },
    error: (err) => {
      this.loadingIndicator = false;
      console.error('Erreur création :', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err?.error?.message || 'Erreur lors de la création de l’entité.',
      });
    },
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

  addRecordSuccess() {
    this.toastr.success('Adjonction réalisée avec succès.', '');
  }

  deleteRecordSuccess(count: number) {
    this.toastr.error(count + 'Eradication diligente pleinement consommée.', '');
  }


  /**
   * Alternative : Récupère toutes les activités et compte côté client
   */
  loadActiviteCountFromAllActivites(): void {
    this.glogalService.get('activite').subscribe({
      next: (activites: any[]) => {
        // Initialiser le compteur pour toutes les entités à 0
        this.entite.forEach(entite => {
          if (entite.id) {
            this.activiteCount[entite.id] = 0;
          }
        });

        // Compter les activités pour chaque entité
        activites.forEach(activite => {
          if (activite.entiteId && this.activiteCount.hasOwnProperty(activite.entiteId)) {
            this.activiteCount[activite.entiteId]++;
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement des activités', err);
        // Initialiser à 0 en cas d'erreur
        this.entite.forEach(entite => {
          if (entite.id) {
            this.activiteCount[entite.id] = 0;
          }
        });
      }
    });
  }


}

export interface selectEntiteInterface {
  nom: string;
  description: string;
  logo: string;
  responsable: Utilisateur;
}
