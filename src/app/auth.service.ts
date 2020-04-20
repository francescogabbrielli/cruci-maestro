import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { skip } from 'rxjs/operators';

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
    //this.user.subscribe((v) => console.log("USER", v));
    let user = JSON.parse(localStorage.getItem('currentUser'));
    if (user!==null)
      this.login(user.username, user.password);
    else
      this.logout();
  }

  subscribe(fn) {
    return this.user.pipe(skip(1)).subscribe(fn);
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
        localStorage.setItem('currentUser', JSON.stringify(user));
        console.log("LOGIN", user);
        this.user.next(user);
        return true;
      }
    );
  }

  logout() {
      // remove user from local storage and set current user to null
      this.be.logout().then(
        data => this.user.next(null),
        err  => console.log(err),
      );
      localStorage.removeItem('currentUser');
      console.log("LOGOUT");
  }

  updateUserConfig() {
    if (this.user.value != null) {
      this.be.updateUserConfig(this.user.value).then(() =>
        this.user.next(this.user.value));
    }
  }

}
