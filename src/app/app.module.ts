import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent, HelpComponent } from './app.component'
import { SchemaComponent } from './schema/schema.component'
import { DefsComponent } from './defs/defs.component'
import { DefinitionListComponent } from './definition-list/definition-list.component'
import { SettingsComponent } from './settings/settings.component'
import { LoginComponent } from './login/login.component'
import { SchemaEditorComponent } from './schema-editor/schema-editor.component'

import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { DragDropModule } from '@angular/cdk/drag-drop'
import { LayoutModule } from '@angular/cdk/layout'
import { FormsModule } from '@angular/forms'
import { MatCardModule } from '@angular/material/card'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatButtonModule } from '@angular/material/button'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatRadioModule } from '@angular/material/radio'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatBottomSheetModule } from '@angular/material/bottom-sheet'


@NgModule({
  declarations: [
    AppComponent,
    HelpComponent,
    SchemaComponent,
    DefsComponent,
    DefinitionListComponent,
    SettingsComponent,
    LoginComponent,
    SchemaEditorComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    DragDropModule,
    LayoutModule,
    FormsModule,
    MatCardModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatSnackBarModule,
    MatBottomSheetModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
