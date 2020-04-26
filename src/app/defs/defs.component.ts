import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input } from '@angular/core'
import { Subscription } from 'rxjs/Subscription'

import { Config } from '../auth.service'
import { SchemaService } from '../schema.service'
import { Definition, Highlight, SchemaType } from '../schema.model'
import { SchemaState } from '../schema/state'


@Component({
  selector: 'defs',
  templateUrl: './defs.component.html',
  styleUrls: ['./defs.component.sass']
})
export class DefsComponent implements OnInit, OnDestroy, OnChanges {

  service: SchemaService

  subscription: Subscription

  @Input()
  config:Config

  @Input()
  type:SchemaType

  @Input()
  state:SchemaState

  @Input()
  selection:Highlight

  @Input()
  tabindex:number

  defs:Definition[]

  constructor(service: SchemaService) {
    this.service = service
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes:SimpleChanges): void {
    if (changes.selection!==undefined)
      this.defs = this.service.getDefs(this.selection)
    //console.log(this.defs)
  }

  ngOnDestroy(): void {
  }

  onChange():void {
    this.service.setDef(this.defs[0])
  }

}
