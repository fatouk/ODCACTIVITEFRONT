import {Injectable, NgZone, OnInit} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {Liste} from "@core/models/Liste";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from 'ngx-toastr';
import { GlobalService } from './global.service';

@Injectable({
  providedIn: 'root'
})
export class DataSharingService implements OnInit{
  private selectedListe: Liste | null = null;
  private listeData: Liste | null = null;

  setSelectedListe(liste: Liste): void {
    this.selectedListe = liste;
  }

  getSelectedListe(): Liste | null {
    return this.selectedListe;
  }

  clearSelectedListe(): void {
    this.selectedListe = null;
  }

  constructor(
    private globalService: GlobalService,
    private ngZone: NgZone,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router,
    private glogalService: GlobalService,
    private dataSharingService: DataSharingService // Ajoutez ceci
  ) {}
  navigateToListeDebut(row: any): void {
    this.dataSharingService.setSelectedListe(row);
    this.router.navigate(['/listeDebut']);
  }

  navigateToListeResultat(row: any): void {
    this.dataSharingService.setSelectedListe(row);
    this.router.navigate(['/listeResultat']);
  }

// Dans vos composants de destination :
  ngOnInit(): void {
    this.listeData = this.dataSharingService.getSelectedListe();
    if (!this.listeData) {
      this.router.navigate(['/etape']);
    }
  }
}
