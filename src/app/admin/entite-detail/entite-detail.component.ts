import { Component } from '@angular/core';
import {Entite} from "@core/models/Entite";
import {Utilisateur} from "@core/models/Utilisateur";
import {
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
import {ActivatedRoute, Router} from "@angular/router";
import {NgForOf, NgIf} from "@angular/common";
import {EncryptionService} from "@core/service/encryption.service";
import Swal from "sweetalert2";
import {selectEntiteInterface} from "../entite/entite.component";
import {TypeActivite} from "@core/models/TypeActivite";

@Component({
  selector: 'app-entite-detail',
  imports: [
    NgIf,
    FormsModule,
    NgForOf,
    ReactiveFormsModule
  ],
  templateUrl: './entite-detail.component.html',
  styleUrl: './entite-detail.component.scss'
})
export class EntiteDetailComponent {

  entite: Entite | null = null;
  selectedUtilisateurId: number | null = null;
  users: Utilisateur[] = [];
  entites:  Entite[] = [];
  allTypeActivite: TypeActivite[] = []; // Pour la liste déroulante des types d'activités
  editForm: UntypedFormGroup;
  register!: UntypedFormGroup;
  loadingIndicator = true;
  selectedFile: File | null = null;
  selectedRowData!: selectEntiteInterface;

  constructor(
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private glogalService: GlobalService,
    private router: Router,
    private route: ActivatedRoute,
    private encryptionService: EncryptionService // Injectez le service

  ) {
    this.editForm = this.fb.group({
      id: new UntypedFormControl(),
      nom: new UntypedFormControl(),
      description: new UntypedFormControl(),
      logo: new UntypedFormControl(),
      responsable: new UntypedFormControl(),
      allTypeActivite: new UntypedFormControl(),
      typeActivite: new UntypedFormControl(), // ✅ Ajoutez cette ligne
    });
  }

  ngOnInit() {

    this.getAllTypeActivite();

   /* const encryptedEntiteId = this.route.snapshot.paramMap.get('id');
    if (encryptedEntiteId) {
      const decryptedEntiteId = this.encryptionService.decrypt(encryptedEntiteId);
      if (decryptedEntiteId) {
        this.glogalService.getById('entite', decryptedEntiteId).subscribe((data: Entite) => {
          console.log(data.responsable?.nom);
          this.entite = data;
          this.selectedUtilisateurId = data.responsable?.id || null;
          this.getAllUtilisateur();
        });
      } else {
        console.error('Impossible de décrypter l\'ID de l\'entité.');
        // Gérez le cas où la décryption échoue (redirigez l'utilisateur, affichez un message, etc.)
      }
    } else {
      this.getAllUtilisateur();
    }*/
    console.log('ngOnInit déclenché dans EntiteDetailComponent');

    const state = history.state;
    console.log('ID reçu via navigation state:', state);

    const id = state?.entiteId;

    if (id) {
      this.glogalService.getById('entite', id).subscribe({
        next: (data: Entite) => {
          this.entite = data;
          this.selectedUtilisateurId = data.responsable?.id || null;
          this.getAllUtilisateur();
        },
        error: (err) => {
          console.error('Erreur lors du chargement de l’entité :', err);
        }
      });
    } else {
      console.error("Aucun ID d'entité trouvé dans l'état de navigation.");
      this.back(); // redirection ou message
    }

    this.register = this.fb.group({
      id: [''],
      nom: ['', [Validators.required]],
      description: ['', [Validators.required]],
      logo: [''],
      responsable: [null, [Validators.required]],
      typeActivite: [null, [Validators.required]], // Ajoutez ce FormControl pour correspondre à formControlName
      selectedTypeActivites: [null], // Vous utilisez déjà selectedTypeActivites pour stocker les IDs

    });
  }

  back(): void {
    this.router.navigate(['/entite']);
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  getAllUtilisateur(){
    this.glogalService.get('utilisateur').subscribe({
      next:(value: Entite[]) =>{
        this.users = value;
        console.log("Users", this.users)
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

  editRow(row: any, content: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
    });
    this.editForm.setValue({
      id: row.id,
      nom: row.nom,
      description: row.description,
      logo: '', // à vérifier
      responsable: row.responsable?.id,
      allTypeActivite: row.typeActivite || [],
      typeActivite: row.typeActivite || [],
    });
    this.selectedRowData = row;
  }

  onEditSave(form: UntypedFormGroup) {
    if (form?.value?.id) {
      this.loadingIndicator = true;

      const formData = new FormData();

      // Construction de l'objet entité sans les propriétés inutiles
      const updatedEntite = {
        id: form.value.id,
        nom: form.value.nom,
        description: form.value.description,
        logo: form.value.logo,
        responsable: form.value.responsable?.id,
        allTypeActivite: form.value.typeActivite || [],
      };

      // Ajouter l'objet entité au FormData
      formData.append('entiteOdc', new Blob([JSON.stringify(updatedEntite)], { type: 'application/json' }));

      // Ajouter le fichier logo si présent
      if (this.selectedFile) {
        formData.append('logo', this.selectedFile, this.selectedFile.name);
      }

      // Ajouter les types d'activités sélectionnés
      const selectedActivityIds: number[] = form.get('typeActivite')?.value || [];
      selectedActivityIds.forEach(typeId => {
        formData.append('typeActiviteIds', typeId.toString());
      });

      // Ajouter l'utilisateur responsable
      const selectedUserId: number = form.get('responsable')?.value;
      if (!selectedUserId) {
        this.loadingIndicator = false;
        Swal.fire({
          icon: 'info',
          title: '<span class="text-orange-500">Info</span>',
          text: 'Veuillez sélectionner un responsable.',
          confirmButtonText: 'Ok',
          customClass: {
            confirmButton: 'bg-orange-500 text-white hover:bg-orange-600',
          },
        });
        return;
      }
      formData.append('utilisateurId', selectedUserId.toString());

      // Envoi de la requête de mise à jour
      this.glogalService.update("entite", form.value.id, formData).subscribe({
        next: () => {
          this.modalService.dismissAll();
          this.editRecordSuccess();
          this.loadingIndicator = false;
        },
        error: (err) => {
          this.loadingIndicator = false;
          console.error('Erreur lors de la mise à jour :', err);

          let message = err.error?.message || err.message || 'Une erreur est survenue.';
          Swal.fire({
            icon: 'error',
            title: '<span class="text-red-500">Erreur</span>',
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

  deleteSingleRow(row: any) {
    Swal.fire({
      title: 'Voulez vous vraiment supprimer',
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
    this.glogalService.delete("entite", row.id!).subscribe({
      next:(response) =>{
        this.users = response;
        console.log(response);
        this.loadingIndicator = true;
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
        this.back();

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


  editRecordSuccess() {
    this.toastr.success('Modification opéré', '');
  }

  deleteRecordSuccess(count: number) {
    this.toastr.success('Eradication diligente pleinement consommée.', '');
  }


}
