import { Component } from '@angular/core'
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'
import { Observable } from 'rxjs'
import { map, shareReplay } from 'rxjs/operators'
import { MatSnackBar } from '@angular/material/snack-bar'

import { AuthService } from './auth.service'
import { SchemaService } from './schema.service'
import { SchemaType } from './schema.model'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {

  readonly title:string = "CruciMaestro"

  auth:AuthService
  schema:SchemaService
  obliged:SchemaType = SchemaType.Obliged


  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    )

  constructor(private breakpointObserver: BreakpointObserver,
    auth:AuthService, schema:SchemaService, private bar:MatSnackBar) {
    this.auth = auth
    this.schema = schema
    this.bar = bar
  }

  showMessage(message, action) {
    this.bar.open(message, action, {
      duration: 3000
    })
  }

  check() {
    this.schema.check().then(res => {
      let ok = "KO"
      res = parseInt(res)
      let message = "Non ci siamo ancora..."
      if (res > 80)
        message = "C'è ancora molto da lavorare..."
      else if (res > 90)
        message = "Ci stiamo arrivando"
      else if (res > 95)
        message = "Ancora un piccolo sforzo!"
      else if (res > 99)
        message = "...ci siamo quasi!"
      else if (res == 100) {
        ok = "OK"
        message = "Complimenti! Cruciverba completato!"
      }
      this.showMessage(message, ok)
    });
  }

}
