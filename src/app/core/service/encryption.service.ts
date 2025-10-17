import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  private readonly secretKey: string = this.generateRandomKey(32); // Générer la clé lors de l'instanciation du service

  constructor() {
    console.log('Clé secrète générée:', this.secretKey); // Optionnel : pour vérifier la clé générée
  }

  private generateRandomKey(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+=-`~[]\{}|;\':",./<>?';
    let key = '';
    for (let i = 0; i < length; i++) {
      key += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return key;
  }

  encrypt(value: string): string {
    return CryptoJS.AES.encrypt(value, this.secretKey).toString();
  }

  decrypt(encryptedValue: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedValue, this.secretKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Erreur de décryptage:', error);
      return ''; // Ou une autre valeur par défaut en cas d'erreur
    }
  }
}
