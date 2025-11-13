import {Component, ViewChild} from '@angular/core';
import {DatatableComponent, NgxDatatableModule, SelectionType} from "@swimlane/ngx-datatable";
import {TypeActivite} from "@core/models/TypeActivite";
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
import {Participant} from "@core/models/Participant";
import {Activity} from "@core/models/Activity";
import {NgClass, NgIf} from "@angular/common";
import {RouterLink} from "@angular/router";
import { Liste } from '@core/models/Liste';

@Component({
  selector: 'app-participant',
  imports: [
    FormsModule,
    NgxDatatableModule,
    ReactiveFormsModule,
    RouterLink,
    NgClass
  ],
  templateUrl: './participant.component.html',
  styleUrl: './participant.component.scss'
})
export class ParticipantComponent {

  @ViewChild(DatatableComponent, { static: false }) table!: DatatableComponent;
  rows = [];
  participants:  Participant[] = [];
  filteredParticipants: Participant[] = [];
  activity:  Activity[] = [];
  scrollBarHorizontal = window.innerWidth < 1200;
  selectedRowData!: selectParticipantInterface;
  filteredData: any[] = [];
  blacklistedEmails: string[] = [];
  blacklistedPhones: string[] = [];
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
    { prop: 'phone' },
    { prop: 'genre' },
  ];

  genre: string[] = ['Homme', 'Femme'];

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
      nom: new UntypedFormControl(),
      prenom: new UntypedFormControl(),
      email: new UntypedFormControl(),
      phone: new UntypedFormControl(),
      genre: new UntypedFormControl(),
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

  ngOnInit() {
    this.getAllParticipant();
    this.fetchBlacklistedParticipants();

    this.register = this.fb.group({
      id: [''],
      nom: ['', [Validators.required]],
      prenom: ['', [Validators.required]],
      email: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      genre: ['', [Validators.required]],
    });
  }
  // fetch data
  getAllParticipant(){
    this.loadingIndicator = true;
    this.glogalService.get('participant').subscribe({
      next:(value: TypeActivite[]) =>{
        console.log("Participants chargés:", value);
        this.participants = value;
        this.filteredData = [...value];
        setTimeout(() =>{
          this.loadingIndicator = false;
        },500);
      }
    })
  }

  filterDatatable(event: any) {
    const val = event.target.value.toLowerCase();
    this.participants = this.filteredData.filter((item) => {
      return Object.values(item).some((field: any) =>
        field?.toString().toLowerCase().includes(val)
      );
    });

    this.table.offset = 0;
  }

  getRowClass = (row: any) => {
    return {
      'blacklisted-row': row.isBlacklisted === true
    };
  };

  fetchBlacklistedParticipants(): void {
    this.glogalService.get('blacklist').subscribe({
      next: (data) => {
        this.blacklistedEmails = data.map((item: { email: any }) => item.email.toLowerCase());
        this.blacklistedPhones = data.map((item: { phone: any }) => item.phone);
        // Après avoir récupéré la blacklist, mettre à jour les participants
        this.participants = this.participants.map((participant) => ({
          ...participant,
          isBlacklisted: this.checkIfBlacklisted(participant)
        }));

        // Mettre à jour les participants filtrés
        this.filteredParticipants = [...this.participants];
      },
      error: (err) => {
        this.toastr.error('Erreur lors de la récupération des participants blacklistés.', '');
      }
    });
  }

  checkIfBlacklisted(participant: Participant): boolean {
    const isEmailBlacklisted = participant.email ? this.blacklistedEmails.includes(participant.email.toLowerCase()) : false;
    const isPhoneBlacklisted = participant.phone ? this.blacklistedPhones.includes(participant.phone) : false;
    return isEmailBlacklisted || isPhoneBlacklisted;
  }

}

export interface selectParticipantInterface {
  nom?: string;
  prenom?: string;
  email?: string;
  phone?: string;
  genre?: string;
  isBlacklisted?: boolean;
  activite?: Activity;// Permettre que ce soit null
  

}