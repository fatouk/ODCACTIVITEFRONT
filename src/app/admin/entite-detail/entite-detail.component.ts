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
import { co } from '@fullcalendar/core/internal-common';
import { C } from '@angular/cdk/scrolling-module.d-ud2XrbF8';

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
  selectedUtilisateurId: Number | null = null;
  users: Utilisateur[] = [];
  selectedUtilisateur: Utilisateur | null = null;
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
    this.getEntiteById();
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
getEntiteById(){
    const state = history.state;
    const id = state?.entiteId;
    if (id) {
      this.glogalService.getById('entite', id).subscribe({
        next: (data: Entite) => {
          this.entite = data;
          const respon= data.responsable;
          this.selectedUtilisateurId =  data.responsable as unknown as Number;
          // console.log("Responsable ID===", this.selectedUtilisateurId);
          this.getResponsableByEntite(respon!);
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
}

getResponsableByEntite( respon:any): void {
  this.glogalService.get('utilisateur').subscribe({
    next: (users: any[]) => {
      //this.utilisateurs = users;
      // console.log("👥 Liste complète des utilisateurs :", users);

      // ✅ Exemple 1 : forEach
      // users.forEach(user => {
      //   console.log("➡️ Utilisateur :", user.nom);
      // });

      // ✅ Exemple 2 : trouver le responsable
      if (respon) {
        this.selectedUtilisateur = users.find(u => u.id === respon);

        if (this.selectedUtilisateur) {
          console.log("✅ Responsable trouvé :", this.selectedUtilisateur);
        } else {
          console.warn("⚠️ Aucun utilisateur ne correspond à cet ID :", this.selectedUtilisateurId);
        }
      }
    },
    error: (err) => {
      console.error("❌ Erreur lors du chargement des utilisateurs :", err);
    }
  });
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
      responsable: row.responsable,
      allTypeActivite: row.typeActivite || [],
      typeActivite: row.typeActivitesIds || [],
    });
    this.selectedRowData = row;
  }

 onEditSave(form: UntypedFormGroup) {
  if (!form.value?.id) {
    console.error("❌ Pas d'ID dans le formulaire");
    return;
  }

  this.loadingIndicator = true;

  // Construction du DTO
  const updatedEntite = {
    id: form.value.id,
    nom: form.value.nom,
    description: form.value.description,
    responsable: form.value.responsable || null,
    typeActivitesIds: form.value.typeActivite || []
  };
  //  Création du FormData
  const formData = new FormData();

  // 3️⃣ Ajout du JSON au FormData sous forme de BLOB (très important)
  try {
    const entiteBlob = new Blob([JSON.stringify(updatedEntite)], { type: 'application/json' });
    formData.append('entite', entiteBlob);
  } catch (err) {
    console.error("❌ Erreur JSON.stringify :", err);
  }

  // 4️⃣ Ajout du fichier logo si sélectionné
  if (this.selectedFile) {
    formData.append('logo', this.selectedFile);
  } else {
    console.log("⚠️ Aucun logo sélectionné");
  }

    // Appel HTTP (PUT)
   this.glogalService.updateEntity("entite",form.value.id, formData).subscribe({
     next: () => {
          this.modalService.dismissAll();
          this.editRecordSuccess();
          this.getEntiteById();
          this.loadingIndicator = false;
          
        },
    error: (err) => {
      console.error("❌ Erreur API :", err);
      this.loadingIndicator = false;
    }
  });
}

  /** ✅ Message de succès création */
  creationSuccess() {
    Swal.fire({
      icon: 'success',
      title: 'Succès',
      text: 'Entité créée avec succès !',
    });
  }

  /** ✅ Message de succès édition */
  editRecordSuccessN() {
    Swal.fire({
      icon: 'success',
      title: 'Succès',
      text: 'Entité mise à jour avec succès !',
    });
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
