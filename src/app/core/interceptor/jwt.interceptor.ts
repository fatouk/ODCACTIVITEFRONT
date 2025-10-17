import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '@core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /*intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // add authorization header with jwt token if available
    let currentUser = this.authService.getCurrentUserFromStorage();
    console.log('JwtInterceptor - currentUser au début:', currentUser);

    const token = currentUser?.token;


    if (token) {
      console.log('JwtInterceptor - Token trouvé:', token);

      // Vérifier si le token est expiré (si votre AuthService a une méthode pour ça)
      if (this.authService.isTokenExpired && this.authService.isTokenExpired(token)) {
        // Si le token est expiré dans un environnement navigateur
        if (isPlatformBrowser(this.platformId)) {
          this.authService.logout();
          this.router.navigate(['/authentication/signin']);
        }
        // Ne pas ajouter l'header Authorization avec un token expiré
        return next.handle(request);
      }

      const clonedReq = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      return next.handle(clonedReq);
    }

    return next.handle(request);
  }*/

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const currentUser = this.authService.getCurrentUserFromStorage();
    const token = currentUser?.bearer;

    if (token) {
      if (this.authService.isTokenExpired && this.authService.isTokenExpired(token)) {
        if (isPlatformBrowser(this.platformId)) {
          this.authService.logout();
          this.router.navigate(['/authentication/signin']);
        }
        return next.handle(request);
      }

      const clonedRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });

      return next.handle(clonedRequest);
    }

    return next.handle(request);
  }
}
