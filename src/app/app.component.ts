import { Component } from '@angular/core'
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'
import { Observable } from 'rxjs'
import { map, shareReplay } from 'rxjs/operators'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';


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

  private helpSheet:MatBottomSheet

  auth:AuthService
  schema:SchemaService
  obliged:SchemaType = SchemaType.Obliged


  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    )

  constructor(private breakpointObserver: BreakpointObserver,
    auth:AuthService, schema:SchemaService, private bar:MatSnackBar, private sheet:MatBottomSheet) {
    this.auth = auth
    this.schema = schema
    this.bar = bar
    this.helpSheet = sheet
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
      if (res == 100) {
        message = "Complimenti! Cruciverba completato!"
        ok = "OK"
      } else if (res > 99)
        message = "...Quasi!"
      else if (res > 95)
        message = "Ancora un piccolo sforzo!"
      else if (res > 90)
        message = "Ci stiamo arrivando"
      else if (res > 85)
        message = "Continua così!"
      else if (res > 80)
        message = "C'è ancora un po' da lavorare..."
      this.showMessage(message, ok)
    });
  }

  help() {
    this.helpSheet.open(HelpComponent);
  }

}


@Component({
  selector: 'help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.sass']
})
export class HelpComponent {
  private auth:AuthService
  private schema:SchemaService
  constructor(auth:AuthService, schema:SchemaService) {
    this.auth = auth
    this.schema = schema
  }
  isAuthor():boolean {
    return this.auth.getUserConfig().authorMode
  }
  isFixed():boolean {
    return this.schema.model.type === SchemaType.Fixed
  }
}
