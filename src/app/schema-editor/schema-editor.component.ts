import { Component, OnInit, OnDestroy } from '@angular/core'
import { Subscription } from 'rxjs/Subscription'

import { AuthService, User, Config } from '../auth.service'
import { SchemaService } from '../schema.service'
import { Definition, Highlight, SchemaType } from '../schema.model'
import { SchemaState } from '../schema/state'


@Component({
  selector: 'app-schema-editor',
  templateUrl: './schema-editor.component.html',
  styleUrls: ['./schema-editor.component.sass']
})
export class SchemaEditorComponent implements OnInit, OnDestroy {

  auth:AuthService
  schema:SchemaService

  //just need to subscribe to schema service
  private schemaSubscription:Subscription

  state:SchemaState

  selection:Highlight

  tabindex = { defs: 2 }

  userConfig:Config

  type:SchemaType

  onStateChanged(s:SchemaState) {
    this.state = s
  }

  onSelected(h:Highlight) {
    this.selection = h
  }

  onDefinitionSelection(h:Highlight) {
    this.selection = h
  }

  constructor(auth:AuthService, schema: SchemaService) {
    this.auth = auth
    this.schema = schema
    this.selection = schema.getSelection()
    console.log(this.selection)
    this.userConfig = auth.getUserConfig()
    this.type = schema.model.type
  }

  ngOnInit(): void {
    this.schemaSubscription = this.schema.subscribe(loading => {
      if (loading)
        return
      this.userConfig = {...this.auth.getUserConfig()}
      this.type = this.schema.model.type
      console.log("SCHEMA CHANGE", this.userConfig)
    });
  }

  ngOnDestroy():void {
    this.schemaSubscription.unsubscribe();
  }

}
