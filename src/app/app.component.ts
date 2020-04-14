import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import { ConfigService } from './config.service';
import { SchemaService } from './schema.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {

  config:ConfigService;
  schema:SchemaService;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(private breakpointObserver: BreakpointObserver, config:ConfigService, schema:SchemaService) {
    this.config = config;
    this.schema = schema;
  }

  load() {
    this.schema.load();
  }

  save() {
    this.schema.save();
  }

}
