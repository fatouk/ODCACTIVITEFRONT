import {Component, ViewChild} from '@angular/core';
import {FormsModule, ReactiveFormsModule, UntypedFormBuilder} from "@angular/forms";
import {DatatableComponent, NgxDatatableModule, SelectionType} from "@swimlane/ngx-datatable";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ToastrService} from "ngx-toastr";
import {GlobalService} from "@core/service/global.service";
import {BlackList} from "@core/models/Blacklist";
import {NgIf} from "@angular/common";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-blacklist',
  imports: [
    FormsModule,

    NgxDatatableModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './blacklist.component.html',
  styleUrl: './blacklist.component.scss'
})
export class BlacklistComponent {
  @ViewChild(DatatableComponent, { static: false }) table!: DatatableComponent;
  rows = [];
  blacklist:  BlackList[] = [];
  scrollBarHorizontal = window.innerWidth < 1200;
  selectedRowData!: selectBlaclistInterface;
  filteredData: any[] = [];
  loadingIndicator = true;
  isRowSelected = false;
  reorderable = true;
  public selected: number[] = [];
  columns = [
    { prop: 'nom' },
    { prop: 'prenom' },
    { prop: 'email' },
    { prop: 'phone' },
  ];

  @ViewChild(DatatableComponent, { static: false }) table2!: DatatableComponent;
  selection!: SelectionType;

  constructor(
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private glogalService: GlobalService
  ) {
    // this.editForm = this.fb.group({
    //   id: new UntypedFormControl(),
    //   nom: new UntypedFormControl(),
    // });
    // window.onresize = () => {
    //   this.scrollBarHorizontal = window.innerWidth < 1200;
    // };
    this.selection = SelectionType.checkbox;
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

  ngOnInit() {
   this.getAllBlacklist();

    // this.register = this.fb.group({
    //   id: [''],
    //   nom: ['', [Validators.required, Validators.pattern('[a-zA-Z]+')]],
    // });
  }

  getAllBlacklist(){
    this.loadingIndicator = true;
    this.glogalService.get('blacklist').subscribe({
      next:(value: BlackList[]) =>{
        this.blacklist = value;
        this.filteredData = [...value];
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
      }
    })
  }

  filterDatatable(event: any) {
    const val = event.target.value.toLowerCase();

    this.blacklist = this.filteredData.filter((item) => {
      return Object.values(item).some((field: any) =>
        field?.toString().toLowerCase().includes(val)
      );
    });

    this.table.offset = 0;
  }

}
export interface selectBlaclistInterface{
  nom: string;
  prenom: string;
  email: string;
  phone: string;
}
