import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { SchemaEditorComponent } from './schema-editor/schema-editor.component'
import { DefinitionListComponent } from './definition-list/definition-list.component'
import { SettingsComponent } from './settings/settings.component'
import { LoginComponent } from './login/login.component'

const routes: Routes = [
  {path: '', redirectTo: '/schema', pathMatch: 'full' },
  {path: 'schema', component: SchemaEditorComponent},
//  {path: 'schema/:sel', component: SchemaComponent},
  {path: 'definitions', component: DefinitionListComponent},
  {path: 'settings', component: SettingsComponent},
  {path: 'login', component: LoginComponent}
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
