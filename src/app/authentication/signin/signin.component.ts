import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { AuthService } from '@core';
import { GlobalService } from "@core/service/global.service";
import {isPlatformBrowser, NgIf} from '@angular/common';
import Swal from 'sweetalert2';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FeatherModule,
    RouterLink,
    NgIf,
  ]
})
export class SigninComponent implements OnInit {
  loginForm!: UntypedFormGroup;
  submitted = false;
  isConnected: boolean = false;
  currentYear: number = new Date().getFullYear();
  returnUrl!: string;
  error = '';
  hide = true;
  username!: string;
  password!: string;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private authService: AuthService,
    private globaleService: GlobalService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdRef: ChangeDetectorRef,
    private toast: MatSnackBar // Utilisez MatSnackBar comme 'toast'
  ) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [''],
    });
  }

  // Getter pour accéder facilement aux contrôles du formulaire
  get f() {
    return this.loginForm.controls;
  }

  showError(message: string) {
    Swal.fire({
      icon: 'error',
      title: '<span class="text-orange-500">Erreur</span>',
      html: `<p class="text-orange-500">${message}</p>`,
      confirmButtonText: 'Réessayer',
      customClass: {
        confirmButton: 'btn btn-warning', // Couleur
      },
    });
  }

  resetForm() {
    this.loginForm.reset();
    this.submitted = false;
    this.username = '';
    this.password = '';
  }

  login() {
    if (!this.f['username'].value || !this.f['password'].value) {
      this.showError("Nom utilisateur || email et mot de passe sont requis.");
      return;
    }

    this.authService.login(this.f['username'].value, this.f['password'].value).subscribe({
      next: response => {
        const token = response?.bearer; // Assurez-vous que la propriété est 'bearer' et peut être undefined

        if (isPlatformBrowser(this.platformId) && token) {
          localStorage.setItem("currentUser", JSON.stringify(response));
          const roles = this.authService.getCurrentUserFromStorage().roles; // Assurez-vous que cette méthode existe et retourne un tableau de rôles
          this.authService.currentUserSubject.next(response); // Mettre à jour le BehaviorSubject

          // Redirection en fonction du rôle
          if (roles?.includes('SUPERADMIN')) {
            this.router.navigateByUrl('/dashboard/main').then(() => {
              this.cdRef.detectChanges();
            });
          } else if (roles?.includes('PERSONNEL')) {
            this.router.navigateByUrl('/dashboardActivite').then(() => {
              this.cdRef.detectChanges();
            });
          } else {
            this.router.navigateByUrl('/dashboard/main').then(() => {
              this.cdRef.detectChanges();
            });
          }

          // Affichage du toast de succès
          const Toast = Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.onmouseenter = Swal.stopTimer;
              toast.onmouseleave = Swal.resumeTimer;
            }
          });
          Toast.fire({
            icon: "success",
            title: "Bienvenu dans votre espace sécurisé pour la gestion des activités"
          });
        } else {
          this.toast.open("Aucun token reçu dans la réponse.", "Erreur", { duration: 4000 });
        }

        this.resetForm();
      },
      error: error => {
        Swal.fire({
          icon: 'error',
          title: '<span class="text-orange-500">Erreur d\'authentification</span>',
          html: '<p class="text-orange-500">L’identifiant ou le mot de passe fourni ne concorde pas. Veuillez vérifier l’exactitude des informations saisies et réitérer votre tentative.</p>',
          confirmButtonText: 'Réessayer',
          customClass: {
            confirmButton: 'bg-orange-500 text-white hover:bg-orange-600',
          },
        });
        this.resetForm();
      }
    });
  }

  onSubmit() {
    this.login(); // Appeler la fonction login() au lieu de la logique précédente
  }
}


