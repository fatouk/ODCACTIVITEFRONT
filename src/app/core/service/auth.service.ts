import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {catchError, map} from "rxjs/operators";
import { Router } from '@angular/router';
import {jwtDecode} from "jwt-decode";
import {Utilisateur} from "@core/models/Utilisateur";

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private BASE_URL = 'http://localhost:8089';
  //private BASE_URL =  'https://odc-api.onrender.com' ;
  currentUserSubject: BehaviorSubject<Utilisateur & { roles: string[] }>;
  public currentUser: Observable<Utilisateur & { roles: string[] }>;

  constructor(private http: HttpClient, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {
    this.currentUserSubject = new BehaviorSubject<Utilisateur & { roles: string[] }>(this.getCurrentUserFromStorage());
    this.currentUser = this.currentUserSubject.asObservable();
  }


  getDecodedToken(token: string): any {
    return jwtDecode(token);
  }

  // public get currentUserValue(): User & { roles: string[] } {
  //   return this.currentUserSubject.value;
  // }

  get currentUserValue(): Utilisateur & { roles: string[] } {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : {} as Utilisateur & { roles: string[] };
  }


  getCurrentUserFromStorage(): Utilisateur & {bearer?: string, roles: string[] } {
    if (this.isBrowser()) {
      const storedUserString = localStorage.getItem('currentUser');
      const rolesString = localStorage.getItem('roles');
      try {
        const utilisateur = storedUserString ? JSON.parse(storedUserString) as Utilisateur : null;
        const roles = rolesString ? JSON.parse(rolesString) as string[] : [];
        return utilisateur ? {
          ...utilisateur, roles,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
        } : { } as Utilisateur & { roles: string[] }; // Adaptez selon votre modèle User
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur depuis localStorage', error);
      }
    }
    return {} as Utilisateur & { roles: string[] };
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.BASE_URL}/auth/login`, { username, password })
      .pipe(
        map(response => {
          if (response && response.bearer) {
            /*const user = response.user;*/
            const decoded = this.decodeJwt(response.bearer);
            localStorage.setItem('bearerid',decoded.id);
            const user: Utilisateur = {
              id: decoded.id,
              prenom: decoded.prenom,
              nom: decoded.nom,
              email: decoded.sub,
            };
            const roles = decoded && decoded.role ? [decoded.role] : [];

            const currentUserWithRoles = { ...user, bearer: response.bearer, roles };


            localStorage.setItem('currentUser', JSON.stringify(currentUserWithRoles));
            localStorage.setItem('roles', JSON.stringify(roles)); // Redondant si roles est dans currentUser
            this.currentUserSubject.next(currentUserWithRoles);
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  private decodeJwt(token: string): any | null {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Erreur lors du décodage du JWT', error);
      return null;
    }
  }

  getUserRoles(): string[] {
    return this.currentUserValue.roles || [];
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined'; // Simple vérification côté client
  }


  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Erreurs côté client
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Erreurs côté serveur
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(errorMessage);
  }

  error(message: string) {
    return throwError(message);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Décodage du payload
      const expirationDate = payload.exp * 1000; // Conversion en millisecondes
      return Date.now() > expirationDate;
    } catch (error) {
      return true; // Si le token est mal formé ou invalide
    }
  }

  /**
   * Déconnecte l'utilisateur
   */
  logout(): Observable<{ success: boolean }> {
    if (this.isBrowser()) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('roles');
    }

    this.currentUserSubject.next({} as Utilisateur & { roles: string[] });
    // Si vous n'avez pas d'appel backend pour la déconnexion,
    // vous pouvez retourner un Observable qui s'émet immédiatement.
    return of({ success: true });
    // Si vous avez un appel backend, retournez le résultat de cet appel:
    // return this.http.post<{ success: boolean }>(`${this.BASE_URL}/auth/logout`, {});
  }




}
