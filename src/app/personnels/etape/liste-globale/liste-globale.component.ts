import {Component} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {Router} from "@angular/router";

@Component({
  selector: 'app-liste-globale',
  imports: [],
  templateUrl: './liste-globale.component.html',
  styleUrl: './liste-globale.component.scss'
})
export class ListeGlobaleComponent {

  constructor(
    protected modalService: NgbModal,
    private router: Router,
  ) {

  }


  filterByDebut() {
    this.router.navigate(['/listeGlobale'],{ queryParams: { filter: 'debut' } } );
     this.modalService.dismissAll();
    // this.activeModal.close('Filtre début appliqué');
  }

  filterByResultat() {
    this.router.navigate(['/listeGlobale'],{ queryParams: { filter: 'resultat' } } );
    this.modalService.dismissAll();
    // this.activeModal.close('Filtre début appliqué');
  }

  filterByAll() {
    this.router.navigate(['/listeGlobale'],{ queryParams: { filter: 'all' } } );
    this.modalService.dismissAll();
    // this.activeModal.close('Filtre début appliqué');
  }

}
