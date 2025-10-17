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
import {Critere} from "@core/models/Critere";
import {NgIf} from "@angular/common";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-critere',
  imports: [
    FormsModule,
    NgIf,
    NgxDatatableModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './critere.component.html',
  styleUrl: './critere.component.scss'
})
export class CritereComponent {

  @ViewChild(DatatableComponent, { static: false }) table!: DatatableComponent;
  rows = [];
  criteres:  Critere[] = [];
  scrollBarHorizontal = window.innerWidth < 1200;
  selectedRowData!: selectCritereInterface;
  filteredData: any[] = [];
  editForm: UntypedFormGroup;
  register!: UntypedFormGroup;
  loadingIndicator = true;
  isRowSelected = false;
  reorderable = true;
  public selected: number[] = [];
  columns = [
    { prop: 'libelle' },
    { prop: 'intutile' },
    { prop: 'point' },
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
      libelle: new UntypedFormControl(),
      intutile: new UntypedFormControl(),
      point: new UntypedFormControl(),
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
    this.getAllCritere();

    this.register = this.fb.group({
      id: [''],
      libelle: ['', [Validators.required]],
      intutile: ['', [Validators.required]],
      point: [null, [Validators.required]],
    });
  }
  // fetch data
  getAllCritere(){
    this.loadingIndicator = true;
    this.glogalService.get('critere').subscribe({
      next:(value: Critere[]) =>{
        this.criteres = value;
        this.filteredData = [...value];
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
      }
    })
  }

  onAddRowSave(form: UntypedFormGroup) {
    this.loadingIndicator = true;
    this.glogalService.post('critere', form.value).subscribe({
      next: (response) => {
        // Ajouter la nouvelle role reçue à la liste locale
        this.criteres.push(response);
        console.log(this.criteres)
        this.criteres = [...this.criteres];

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
      libelle: row.libelle,
      intutile: row.intutile,
      point: row.point,
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
    this.glogalService.delete("critere", row.id!).subscribe({
      next:(response) =>{
        this.criteres = response;
        this.loadingIndicator = true;
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
        this.getAllCritere();

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
      const updatedCritere = form.value;

      this.glogalService.update("critere", updatedCritere.id, updatedCritere).subscribe({
        next: (value) => {
          console.log(value)
          this.modalService.dismissAll(); // Fermer le modal
          this.editRecordSuccess();       // Appeler callback si défini
          setTimeout(() =>{
            this.loadingIndicator = false;
          },500);
          this.getAllCritere();
        },
        error: (err: { status: number; error: any; message?: string }) => {
          console.error('Erreur lors de la mise à jour  :', err);

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

    this.criteres = this.filteredData.filter((item) => {
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

export interface selectCritereInterface {
  libelle?: string;
  intutile?: string;
  point?: number;
}
