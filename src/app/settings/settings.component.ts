import { Component, OnInit } from '@angular/core';

import { ConfigService } from '../config.service';

@Component({
  selector: 'settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass']
})
export class SettingsComponent implements OnInit {

  config:ConfigService;

  cellSize:number = 28;

  solutionType:string = "fixed";

  constructor(config:ConfigService) {
    this.config = config;
  }

  ngOnInit(): void {
  }

}
