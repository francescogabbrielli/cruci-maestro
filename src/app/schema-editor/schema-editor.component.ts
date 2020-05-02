import { Component, OnInit, OnDestroy } from '@angular/core'
import { Subscription } from 'rxjs/Subscription'

import { MatSnackBar } from '@angular/material/snack-bar'
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

  onStateChanged(s:SchemaState) {
    this.state = s
  }

  onSelected(h:Highlight) {
    this.selection = h
    if (h.length() > 1) {
      let desc:string = h.isHorizontal() ? "Orizzontale" : "Verticale"
      let string:string = this.schema.getDefs(h).map(d => d.desc).join(" - ")
      this.bar.open(string, desc, {duration: 2000})
    }
  }

  onDefinitionSelection(h:Highlight) {
    this.selection = h
  }

  constructor(auth:AuthService, schema: SchemaService, private bar:MatSnackBar) {
    this.auth = auth
    this.schema = schema
    this.bar = bar
    this.selection = this.schema.noSelection
    this.userConfig = auth.getUserConfig()
  }

  ngOnInit(): void {
    this.schemaSubscription = this.schema.subscribe(loading => {
      console.log("SCHEMA CHANGE", loading)
      if (loading)
        return
      this.userConfig = {...this.auth.getUserConfig()}
      this.selection = this.schema.noSelection
    });
  }

  ngOnDestroy():void {
    this.schemaSubscription.unsubscribe();
  }

  isOwner():boolean {
    return this.auth.getUser()!==null && this.schema.model.owner === this.auth.getUser().id
  }

}
