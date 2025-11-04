import { Component } from '@angular/core';
import {RouterLink} from "@angular/router";
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from "@angular/forms";
import {Utilisateur} from "@core/models/Utilisateur";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ToastrService} from "ngx-toastr";
import {GlobalService} from "@core/service/global.service";
import {NgxDatatableModule, SelectionType} from "@swimlane/ngx-datatable";
import {Role} from "@core/models/Role";
import {Entite} from "@core/models/Entite";
import Swal from "sweetalert2";
import {NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-utilisateur',
  imports: [
    RouterLink,
    NgForOf,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    NgxDatatableModule
  ],
  templateUrl: './utilisateur.component.html',
  styleUrl: './utilisateur.component.scss'
})
export class UtilisateurComponent {
  rows = [];
  users:  Utilisateur[] = [];
  role: Role[] = [];
  entite: Entite[] = [];
  scrollBarHorizontal = window.innerWidth < 1200;
  selectedRowData!: selectUtilisateurInterface;
  filteredData: any[] = [];
  editForm: UntypedFormGroup;
  register!: UntypedFormGroup;
  loadingIndicator = true;
  isRowSelected = false;
  reorderable = true;
  public selected: number[] = [];
  columns = [
    { prop: 'nom' },
    { prop: 'prenom' },
    { prop: 'email' },
    { prop: 'genre' },
    { prop: 'phone' }
  ];

  genre: string[] = ['Homme', 'Femme'];

  constructor(
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private glogalService: GlobalService
  ) {
    this.editForm = this.fb.group({
      id: new UntypedFormControl(),
      nom: new UntypedFormControl(),
      prenom: new UntypedFormControl(),
      email: new UntypedFormControl(),
      genre: new UntypedFormControl(),
      phone: new UntypedFormControl(),
      role: new UntypedFormControl(),
      entite: new UntypedFormControl(),
    });
  }

  ngOnInit() {
    this.getAllUtilisateur();
    this.getAllEntite();
    this.getAllRole();
    this.register = this.fb.group({
      id: [''],
      nom: ['', [Validators.required, Validators.pattern('[a-zA-Z]+')]],
      prenom: ['', [Validators.required, Validators.pattern('[a-zA-Z]+')]],
      email: [ '',
        [Validators.required, Validators.email, Validators.minLength(5)],
      ],
      genre: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      role: [null, [Validators.required]],
      entite: [null, [Validators.required]],
    });
  }

  getAllUtilisateur(){
    this.loadingIndicator = true;
    this.glogalService.get('utilisateur').subscribe({
      next:(value: Utilisateur[]) =>{
        this.users = value;
        console.log("Users",this.users)

        this.filteredData = [...value];
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
      }
    })
  }

  getAllRole(){
    // this.loadingIndicator = true;
    this.glogalService.get('role').subscribe({
      next:(value: Role[]) =>{
        this.role = value;
        console.log("role",this.role)

        // this.filteredData = [...value];
        // setTimeout(() =>{
        //   this.loadingIndicator = false;
        // },500);
      }
    })
  }

  getAllEntite(){
    // this.loadingIndicator = true;
    this.glogalService.get('entite').subscribe({
      next:(value: Entite[]) =>{
        this.entite = value;
        console.log("Entite",this.entite)
        // this.filteredData = [...value];
        // setTimeout(() =>{
        //   this.loadingIndicator = false;
        // },500);
      }
    })
  }

  onAddRowSave(form: UntypedFormGroup) {
    this.loadingIndicator = true;
    console.log("Form value", form.value);
    // const payload = { ...form.value, role: Number(form.value.role),entite:{ id: form.value.entite } // <- transforme l'ID en objet}; // conversion string → number
  console.log("Payload envoyé", form.value);
    this.glogalService.post('utilisateur', form.value).subscribe({
      next: (response) => {
        // Ajouter la nouvelle role reçue à la liste locale
        this.users.push(response);
        console.log(response)
        this.users = [...this.users];

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
  editRow(row: any, content: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
    });
    // console.log("row========",row);
    this.editForm.patchValue({
      id: row.id,
      nom: row.nom,
      prenom: row.prenom,
      email: row.email,
      genre: row.genre,
      phone: row.phone,
      role: row.role?.id,
      entite: row.entite?.id,
    });
    this.selectedRowData = row;
  }

  onEditSave(form: UntypedFormGroup) {
    if (form?.value?.id) {
      // Préparer l'objet mis à jour (ici l'exemple suppose que `form.value` contient les nouvelles données)
      const updatedUtilisateur = form.value;
console.log("Updated Utilisateur========", updatedUtilisateur);
      this.glogalService.update("utilisateur", updatedUtilisateur.id, updatedUtilisateur).subscribe({
        next: () => {
          this.modalService.dismissAll(); // Fermer le modal
          this.editRecordSuccess();       // Appeler callback si défini
          setTimeout(() =>{
            this.loadingIndicator = false;
          },500);
          this.getAllUtilisateur();
        },
        error: (err: { status: number; error: any; message?: string }) => {
          console.error('Erreur lors de la mise à jour du rôle :', err);

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
    this.glogalService.delete("utilisateur", row.id!).subscribe({
      next:(response) =>{
        this.users = response;
        console.log(response);
        this.loadingIndicator = true;
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
        this.getAllUtilisateur();

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

  filterDatatable(event: any) {
    const val = event.target.value.toLowerCase();

    this.users = this.filteredData.filter((item) => {
      return Object.values(item).some((field: any) =>
        field?.toString().toLowerCase().includes(val)
      );
    });

  }

  addRecordSuccess() {
    this.toastr.success('Adjonction réalisée avec succès.', '');
  }
  editRecordSuccess() {
    this.toastr.success('Modification opéré', '');
  }
  deleteRecordSuccess(count: number) {
    this.toastr.success('Eradication diligente pleinement consommée.', '');
  }

}

export interface selectUtilisateurInterface {
  nom: string;
  prenom: string;
  email: string;
  genre: string;
  phone: string;
  role: Role;
  entite: Entite;
}
