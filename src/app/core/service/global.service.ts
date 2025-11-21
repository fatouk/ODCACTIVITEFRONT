import { O } from '@angular/cdk/overlay-module.d-B3qEQtts';
import {HttpClient, HttpErrorResponse, HttpResponse} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivityValidation } from '@core/models/ActivityValidation';
import { environment } from 'environments/environment.development';
import { Observable, throwError } from 'rxjs';
import {catchError} from "rxjs/operators";


@Injectable({
  providedIn: 'root'
})
export class GlobalService {

  public baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupère des données à partir d'un point de terminaison spécifié.
   *
   * @param {string} name - Le nom du point de l'endpoint.
   * @return {Observable<any>} Un observable qui émet les données récupérées.
   */
  get(name: string): Observable<any> {
      return this.http.get(`${this.baseUrl}/${name}`).pipe(
      catchError(this.handleError.bind(this))
    );
    
  }
  get2(endpoint: string): Observable<any> {
    console.log('Appel GET à l\'endpoint :', `${this.baseUrl}/${endpoint}`);
  return this.http.get<any>(`${this.baseUrl}/${endpoint}`).pipe(
    catchError(this.handleError.bind(this))
  );
}

  getId(name: string, id:number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${name}/${id}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getById(name: string, id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${name}/${id}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Envoie une requête POST à l'endpoint spécifié pour créer une nouvelle ressource.
   *
   * @param {string} name - Le nom de l'endpoint.
   * @param {Object} object - Les données à envoyer dans le corps de la requête.
   * @return {Observable<Object>} Un observable qui émet la réponse du serveur.
   */
  post(name: string, object: Object): Observable<Object> {
    console.log('Appel POST à l\'endpoint :', Object);
    return this.http.post(`${this.baseUrl}/${name}`, object).pipe(
      catchError(this.handleError.bind(this))
    );
  }
/**
   * Met à jour un objet dans la collection spécifiée.
   *
   * @param {string} name - Le nom de l'endpoint.
   * @param {number} iduser - L'ID de DU USER createur.
   * @param {Object} object - L'objet mis à jour.
   * @return {Observable<Object>} Un observable qui émet l'objet mis à jour.
   */

   postId(name: string,iduser:number, object: Object): Observable<Object> {
    console.log('Appel POST à l\'endpoint :', Object);
    return this.http.post(`${this.baseUrl}/${name}/${iduser}`, object).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Met à jour un objet dans la collection spécifiée.
   *
   * @param {string} name - Le nom de l'endpoint.
   * @param {number} id - L'ID de l'objet à mettre à jour.
   * @param {Object} object - L'objet mis à jour.
   * @return {Observable<Object>} Un observable qui émet l'objet mis à jour.
   */
  update(name: string,id: number, object: Object): Observable<Object> {
    return this.http.patch(`${this.baseUrl}/${name}/${id}`, object).pipe(
      catchError(this.handleError.bind(this))
    );
  }
  updateP(name: string,id: number,listes:Object, object: Object): Observable<Object> {
    return this.http.put(`${this.baseUrl}/${name}/${id}/${listes}`, object).pipe(
      catchError(this.handleError.bind(this))
    );
  }


  /**
   * Met à jour un objet dans la collection spécifiée.
   *
   * @param {string} name - Le nom de l'endpoint.
   * @param {number} id - L'ID de l'objet à mettre à jour.
   * @param {Object} object - L'objet mis à jour.
   * @return {Observable<Object>} Un observable qui émet l'objet mis à jour.
   */
  updateId(name: string,id: number,iduser: number, object: Object): Observable<Object> {
    return this.http.patch(`${this.baseUrl}/${name}/${id}/${iduser}`, object).pipe(
      catchError(this.handleError.bind(this))
    );
  }
   updateEntity(name: string, id: number, object: Object): Observable<Object> {
    return this.http.put(`${this.baseUrl}/${name}/${id}`, object);
  }

  /**
   * Supprime un objet d'une collection spécifiée.
   *
   * @param {string} name - Le nom de l'endpoint .
   * @param {number} id - L'ID de l'objet à supprimer.
   * @return {Observable<any>} Un observable qui émet la réponse du serveur.
   */
  delete(name: string,id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${name}/${id}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  uploadParticipants(id: number, file: File, toListeDebut: boolean) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('toListeDebut', toListeDebut.toString());

    const url = `${environment.uploadUrl}/etape/${id}/participants/upload`;
    // console.log('Appel API à l\'URL :', url); // Supprimé

    return this.http.post(url, formData).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Gestion des erreurs améliorée
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur inconnue est survenue';
    console.error('Erreur capturée dans handleError :', error);
    // Cas 1: HttpErrorResponse normal
    if (error instanceof HttpErrorResponse) {

      if (error.error instanceof ErrorEvent) {
        // Erreur côté client
        errorMessage = `Erreur réseau : ${error.error.message}`;
      } else {
        // Erreur côté serveur
        if (error.error && typeof error.error === 'object' && error.error.message) {
          errorMessage = error.error.message;
        } else if (typeof error.error === 'string') {
          try {
            const parsed = JSON.parse(error.error);
            errorMessage = parsed.message || error.statusText || 'Erreur serveur';
          } catch (e) {
            errorMessage = error.error || error.statusText || 'Erreur serveur';
          }
        } else {
          // Messages par défaut selon le status
          switch (error.status) {
            case 403:
              errorMessage = 'Accès interdit - Vous n\'avez pas les permissions nécessaires';
              break;
            case 404:
              errorMessage = 'Ressource non trouvée';
              break;
              case 409:
              errorMessage = 'Ce nom existe déjà. Veuillez en choisir un autre.' ;
              break;
            case 500:
              errorMessage = 'Erreur interne du serveur';
              break;
            case 0:
              errorMessage = 'Erreur de connexion - Vérifiez votre réseau ou que le serveur est accessible';
              break;
            default:
              errorMessage = error.statusText || `Erreur HTTP ${error.status}`;
          }
        }
      }
    }
    // Cas 2: Erreur quelconque (réseau, timeout, etc.)
    else if (error instanceof Error) {
      errorMessage = error.message || 'Erreur système';
    }
    // Cas 3: Objet d'erreur personnalisé
    else if (error && typeof error === 'object') {
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = 'Erreur inconnue';
      }
    }
    // Cas 4: String
    else if (typeof error === 'string') {
      errorMessage = error;
    }

    // console.log('Message d\'erreur final:', errorMessage); // Supprimé
    return throwError(() => new Error(errorMessage));
  }

  // Méthode utilitaire pour extraire le message d'erreur (optionnelle)
  extractMessageFromError(error: any): string {
    // console.log('Extraction du message d\'erreur:', error); // Supprimé

    let message = 'Une erreur est survenue.';

    // Si c'est une Error créée par handleError
    if (error instanceof Error) {
      return error.message;
    }

    // Si c'est un HttpErrorResponse direct
    if (error instanceof HttpErrorResponse) {
      if (error.error && typeof error.error === 'object' && error.error.message) {
        message = error.error.message;
      } else if (typeof error.error === 'string') {
        try {
          const parsed = JSON.parse(error.error);
          message = parsed.message || error.statusText || 'Erreur serveur';
        } catch (e) {
          message = error.error || error.statusText || 'Erreur serveur';
        }
      } else {
        message = error.message || error.statusText || 'Erreur serveur';
      }
    } else if (error?.message) {
      message = error.message;
    }

    return message;
  }

  createValidation(validation: ActivityValidation, fichier?: File): Observable<ActivityValidation> {
    const formData = new FormData();
    if (fichier) {
       console.log('Appel GET à l\'endpoint :', `${this.baseUrl}/activitevalidation/create`);
        console.log('Fichier à envoyer:', fichier, ) ;    
          formData.append('fichier', fichier);
    }
    formData.append('validation', new Blob([JSON.stringify(validation)], {type: 'application/json' }));

    return this.http.post<ActivityValidation>(`${this.baseUrl}/activitevalidation/create`, formData);

  }
  getActivitesBySuperviseur(superviseurId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/activite/superviseur/${superviseurId}`);
}
getActivitesEnAttenteBySuperviseur(superviseurId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/activite/superviseur/${superviseurId}/attente`);
}
getFichierUrl(id: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/activitevalidation/{id}/fichier`);

}
 getValidationFileResponse(validationId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/activitevalidation/${validationId}/fichier`, {
      observe: 'response',
      responseType: 'blob'
    });
  }
}
