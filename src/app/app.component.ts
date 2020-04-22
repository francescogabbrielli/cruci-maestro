import { Component } from '@angular/core'
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'
import { Observable } from 'rxjs'
import { map, shareReplay } from 'rxjs/operators'

import { AuthService } from './auth.service'
import { SchemaService } from './schema.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {

  readonly title:string = "CruciMaestro"

  auth:AuthService
  schema:SchemaService

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    )

  constructor(private breakpointObserver: BreakpointObserver,
    auth:AuthService, schema:SchemaService) {
    this.auth = auth
    this.schema = schema
  }

  save() {
    this.schema.save()
  }

}
