import {Component, OnInit} from '@angular/core';
import { NgbNav, NgbNavItem, NgbNavItemRole, NgbNavLinkBase, NgbNavLink, NgbNavContent, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterLink } from '@angular/router';
import {AuthService} from "@core";
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { GlobalService } from '@core/service/global.service';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import Swal from 'sweetalert2';
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
    NgbNavOutlet,FormsModule,
    NgIf,
    NgxDatatableModule,
    ReactiveFormsModule,CommonModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  active!: number;
  useRole: string[];
  id=0;
  nom = 'Utilisateur';
  prenom = 'Utilisateur';
  genre = 'Utilisateur';
  email = 'Utilisateur';
  phone = 'Utilisateur';
  etat = true;
  role = 'Personnel';
  password = '';
  newpassword = '';
  profilForm!: UntypedFormGroup;
  passwordsDontMatch = false;

  constructor(private authService: AuthService,private fb: FormBuilder,private globalService: GlobalService,private router: Router
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
        this.id=parseInt(`${decoded.id}`);
        this.nom = `${decoded.nom}`;
        this.prenom = `${decoded.prenom}`;
        this.genre = `${decoded.genre}`;
        this.phone = `${decoded.phone}`;
        this.email = `${decoded.email}`;
        this.role = `${decoded.role}`;
      }
    }
    this.profilForm = this.fb.group({
      prenom: [this.prenom, Validators.required],
      nom: [this.nom, Validators.required],
      genre: [this.genre, Validators.required],
      email: [this.email, [Validators.required, Validators.email]],
      phone: [this.phone],
      role: {'nom':this.useRole[0]},
      password: [''],
      newpassword: ['', Validators.minLength(6)],
      confirmPassword: ['']
    });

    this.profilForm.valueChanges.subscribe(() => {
      const newPass = this.profilForm.get('newpassword')?.value;
      const confirmPass = this.profilForm.get('confirmPassword')?.value;
      this.passwordsDontMatch = newPass !== confirmPass;
    });

  }
 onUpdateProfil(): void {
  console.log("Mise à jour du profil...",this.profilForm.value);
    if (this.profilForm.invalid || this.passwordsDontMatch) return;
    this.globalService.update("utilisateur",this.id,this.profilForm.value).subscribe({
      next:  () => {
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Profil mis à jour avec succès !',
        timer: 2000,
        showConfirmButton: false,
        willClose: () => {
            // redirection après la fermeture de l'alerte
           this.logout();
          }
      });

    },
      error:(err)=>{
 console.error(err)
      Swal.fire({
       icon: 'error',
       title: 'Erreur',
       text: err,
       timer: 2000,
       showConfirmButton: false
      });
      } 
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/authentication/signin']);
  }
}
