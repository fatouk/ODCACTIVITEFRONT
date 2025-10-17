import {Component, OnInit} from '@angular/core';
import { NgbNav, NgbNavItem, NgbNavItemRole, NgbNavLinkBase, NgbNavLink, NgbNavContent, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';
import {AuthService} from "@core";
@Component({
  selector: 'app-profile',
  imports: [
    RouterLink,
    NgbNav,
    NgbNavItem,
    NgbNavItemRole,
    NgbNavLinkBase,
    NgbNavLink,
    NgbNavContent,
    NgbNavOutlet,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  active!: number;
  useRole: string[];
  nom = 'Utilisateur';
  prenom = 'Utilisateur';
  genre = 'Utilisateur';
  email = 'Utilisateur';
  phone = 'Utilisateur';

  constructor(private authService: AuthService,
  ) {
    this.useRole = this.authService.getCurrentUserFromStorage().roles;
    console.log("ROLE : ",this.useRole);
  }

  ngOnInit(): void {

    const userString = localStorage.getItem('currentUser');
    if (userString) {
      const user = JSON.parse(userString);
      const token = user.bearer; // ou le champ exact où est stocké ton token
      if (token) {
        const decoded = this.authService.getDecodedToken(token);
        this.nom = `${decoded.nom}`;
        this.prenom = `${decoded.prenom}`;
        this.genre = `${decoded.genre}`;
        this.phone = `${decoded.phone}`;
        this.email = `${decoded.email}`;
      }
    }
  }

}
