import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SchemaComponent } from './schema/schema.component';
import { DefinitionListComponent } from './definition-list/definition-list.component';
import { SettingsComponent } from './settings/settings.component';

const routes: Routes = [
  {path: '', redirectTo: '/schema', pathMatch: 'full' },
  {path: 'schema', component: SchemaComponent},
  {path: 'schema/:sel', component: SchemaComponent},
  {path: 'definitions', component: DefinitionListComponent},
  {path: 'settings', component: SettingsComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
