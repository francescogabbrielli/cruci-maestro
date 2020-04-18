import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { BackendService } from './backend.service'


export interface Config {
  cellSize:number;
  solutionType:string;
  authorMode:boolean;
}

export interface User {
    id: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    token: string;
    config: Config
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private be:BackendService;

  private user:BehaviorSubject<User>;

  private defaultConfig:Config

  constructor(be:BackendService) {
    this.be = be;
    this.user = new BehaviorSubject(null);
    this.defaultConfig = {
      cellSize: 28,
      solutionType: "fixed",
      authorMode: false
    };
    //this.currentUser = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')));
  }

  subscribe(fn) {
    return this.user.subscribe(fn);
  }

  getUser():User {
    return this.user.value;
  }

  getUserConfig():Config {
    return this.user.value !== null ? this.user.value.config : this.defaultConfig;
  }

  isLogged() {
    return this.user.value !== null;
  }

  login(username, password):Promise<boolean> {
    return this.be.login(username, password).then(
      (user:User) => {
        this.user.next(user);
        return true;
      }
    );
  }

  logout() {
      // remove user from local storage and set current user to null
      // localStorage.removeItem('currentUser');
      this.user.next(null);
  }

  updateUserConfig() {
    if (this.user.value != null) {
      this.be.updateUserConfig(this.user.value);
    }
  }

}
