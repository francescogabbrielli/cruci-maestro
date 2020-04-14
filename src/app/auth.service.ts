import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BackendService } from './backend.service'

export interface User {
    id: number;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  currentUser: BehaviorSubject<User>;

  constructor() {
      this.currentUser = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')));
  }

  isLogged() {
    return this.currentUser.value;
  }

  login(username, password) {

  }

  logout() {
      // remove user from local storage and set current user to null
      localStorage.removeItem('currentUser');
      this.currentUser.next(null);
  }

}
