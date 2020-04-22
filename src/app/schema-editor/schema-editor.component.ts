import { Component, OnInit } from '@angular/core'

import { AuthService } from '../auth.service'
import { SchemaService } from '../schema.service'
import { Definition, Highlight, SchemaType } from '../schema.model'
import { SchemaState } from '../schema/state'


@Component({
  selector: 'app-schema-editor',
  templateUrl: './schema-editor.component.html',
  styleUrls: ['./schema-editor.component.sass']
})
export class SchemaEditorComponent implements OnInit {

  auth:AuthService
  schema:SchemaService

  state:SchemaState

  selection:Highlight

  tabindex = { defs: 2 }

  authorMode:boolean

  type:SchemaType

  onStateChanged(s:SchemaState) {
    this.state = s
  }

  onSelected(h:Highlight) {
    this.selection = h
  }

  constructor(auth:AuthService, schema: SchemaService) {
    this.auth = auth
    this.schema = schema
  }

  ngOnInit(): void {
    this.schema.subscribe(() => {
      let config = this.auth.getUserConfig()
      this.authorMode = config.authorMode
      this.type = this.schema.model.type
      console.log("INIT EDITOR:", this.authorMode)
    })
  }

}
