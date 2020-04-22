import { Component, OnInit, OnDestroy, OnChanges, Input } from '@angular/core'
import {Subscription} from 'rxjs/Subscription'

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
    this.subscription = this.service.subscribe(item => {
       if (item) this.ngOnChanges()
     })
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }

  ngOnChanges(): void {
    this.def = this.service.getDef(this.selection)
  }

  onChange():void {
    this.service.setDef(this.def)
  }
}
