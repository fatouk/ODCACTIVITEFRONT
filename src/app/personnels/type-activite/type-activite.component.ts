import {Component, ViewChild} from '@angular/core';
import {DatatableComponent, NgxDatatableModule, SelectionType} from "@swimlane/ngx-datatable";
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
import Swal from "sweetalert2";
import {TypeActivite} from "@core/models/TypeActivite";
import {Entite} from "@core/models/Entite";
import {NgIf} from "@angular/common";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-type-activite',
  imports: [
    FormsModule,
    NgIf,
    NgxDatatableModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './type-activite.component.html',
  styleUrl: './type-activite.component.scss'
})
export class TypeActiviteComponent {

  @ViewChild(DatatableComponent, { static: false }) table!: DatatableComponent;
  rows = [];
  typeActivites:  TypeActivite[] = [];
  scrollBarHorizontal = window.innerWidth < 1200;
  selectedRowData!: selectTypeActiviteInterface;
  filteredData: any[] = [];
  editForm: UntypedFormGroup;
  register!: UntypedFormGroup;
  loadingIndicator = true;
  isRowSelected = false;
  reorderable = true;
  public selected: number[] = [];
  columns = [
    { prop: 'type' },
  ];

  @ViewChild(DatatableComponent, { static: false }) table2!: DatatableComponent;
  selection!: SelectionType;
  constructor(
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private glogalService: GlobalService
  ) {
    this.editForm = this.fb.group({
      id: new UntypedFormControl(),
      type: new UntypedFormControl(),
    });
    window.onresize = () => {
      this.scrollBarHorizontal = window.innerWidth < 1200;
    };
    this.selection = SelectionType.checkbox;
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
    this.getAllTypeActivite();

    this.register = this.fb.group({
      id: [''],
      type: ['', [Validators.required]],
    });
  }
  // fetch data
  getAllTypeActivite(){
    this.loadingIndicator = true;
    this.glogalService.get('typeActivite').subscribe({
      next:(value: TypeActivite[]) =>{
        this.typeActivites = value;
        this.filteredData = [...value];
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
      }
    })
  }

  onAddRowSave(form: UntypedFormGroup) {
    this.loadingIndicator = true;
    this.glogalService.post('typeActivite', form.value).subscribe({
      next: (response) => {
        // Ajouter la nouvelle role reçue à la liste locale
        this.typeActivites.push(response);
        console.log(this.typeActivites)
        this.typeActivites = [...this.typeActivites];

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


  // add new record
  addRow(content: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'medium',
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
      size: 'meduim',
    });
    this.editForm.setValue({
      id: row.id,
      type: row.type,
    });
    this.selectedRowData = row;
  }
  // delete single row
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
    this.glogalService.delete("typeActivite", row.id!).subscribe({
      next:(response) =>{
        this.typeActivites = response;
        this.loadingIndicator = true;
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
        this.getAllTypeActivite();

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
      // Préparer l'objet mis à jour (ici l'exemple suppose que `form.value` contient les nouvelles données)
      const updatedTypeActivite = form.value;

      this.glogalService.update("typeActivite", updatedTypeActivite.id, updatedTypeActivite).subscribe({
        next: () => {
          this.modalService.dismissAll(); // Fermer le modal
          this.editRecordSuccess();       // Appeler callback si défini
          setTimeout(() =>{
            this.loadingIndicator = false;
          },500);
          this.getAllTypeActivite();
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

    this.typeActivites = this.filteredData.filter((item) => {
      return Object.values(item).some((field: any) =>
        field?.toString().toLowerCase().includes(val)
      );
    });

    this.table.offset = 0;
  }



  addRecordSuccess() {
    this.toastr.success('Adjonction réalisée avec succès.', '');
  }
  editRecordSuccess() {
    this.toastr.success('Modification opéré', '');
  }
  deleteRecordSuccess(count: number) {
    this.toastr.error(count + 'Eradication diligente pleinement consommée.', '');
  }

}

export interface selectTypeActiviteInterface {
  type: string;
  entiteId: Entite;
}
