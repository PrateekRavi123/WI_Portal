import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  TOKEN_KEY = 'a920d10d-7d7e-4a7e-a568-f82677d18c1f';
  constructor() { }

  async getToken(): Promise<any> {
    const Token = sessionStorage.getItem(this.TOKEN_KEY);
    if (!Token) return null;
    return Token;
  }
  clearStorage(): void {
    sessionStorage.clear();
  }
  async storeToken(tokenResponse: string): Promise<void> {
    sessionStorage.setItem(this.TOKEN_KEY, tokenResponse);
  }

  async storeUser(user: string): Promise<void> {
    sessionStorage.setItem('user', user);
  }
  async getUser(): Promise<string | null> {
    return sessionStorage.getItem('user');
  }
  async storeUserRole(user: string): Promise<void> {
    sessionStorage.setItem('role', user);
  }
  async getUserRole(): Promise<string | null> {
    return sessionStorage.getItem('role');
  }
  async storeUserMob(user: string): Promise<void> {
    sessionStorage.setItem('cnt', user);
  }
  async getUserMob(): Promise<string | null> {
    return sessionStorage.getItem('cnt');
  }
}
