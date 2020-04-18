import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';

import { AuthService } from '../auth.service';

@Component({
  selector: 'settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass']
})

export class SettingsComponent implements OnInit, OnDestroy {

  auth:AuthService;

  @ViewChild('userForm')
  userForm:NgForm;


  constructor(auth:AuthService) {
    this.auth = auth;
  }

  ngOnInit(){

  }

  ngOnDestroy() {
    if (this.userForm.dirty)
      this.auth.updateUserConfig();
  }

}
