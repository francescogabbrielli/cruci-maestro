import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input } from '@angular/core'
import { Subscription } from 'rxjs/Subscription'

import { Config } from '../auth.service'
import { SchemaService } from '../schema.service'
import { Definition, Highlight } from '../schema.model'
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
  state: SchemaState

  @Input()
  selection: Highlight

  @Input()
  tabindex: number

  def: Definition

  constructor(service: SchemaService) {
    this.service = service
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  ngOnChanges(changes:SimpleChanges): void {
    if (changes.selection!==undefined)
      this.def = this.service.getDef(this.selection)
  }

  onChange():void {
    this.service.setDef(this.def)
  }
}
