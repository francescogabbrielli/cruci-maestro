import { Component, OnInit, OnDestroy } from '@angular/core'
import { Subscription } from 'rxjs/Subscription'

import { SchemaService } from '../schema.service'
import { Definition } from '../schema.model'

class DefinitionBlock {
  title: string
  lines: Definition[][]
  horizontal:boolean
  constructor(horizontal:boolean, size:number) {
    this.title = horizontal ? "Horizontals" : "Verticals"
    this.lines = Array(size)
    this.horizontal = horizontal
  }
  add(def:Definition):void {
    let dim = this.horizontal ? 0 : 1
    let high = def.highlight
    let line = this.lines[high.start[1-dim]]
    if (!line) {
      line = [def]
    } else {
      for (var i=0; i<line.length; i++) {
        let h = line[i].highlight
        if ((high.start[dim] < h.start[dim]) || (high.start[dim]===h.start[dim] && high.end[dim]<h.end[dim])) {
          line.splice(i, 0, def)
          break
        }
      }
      if (i===line.length)
        line.push(def)
    }
    this.lines[high.start[1-dim]] = line
  }
}

@Component({
  selector: 'definition-list',
  templateUrl: './definition-list.component.html',
  styleUrls: ['./definition-list.component.sass']
})
export class DefinitionListComponent implements OnInit {

  service:SchemaService

  private subscription:Subscription

  defs:Array<DefinitionBlock>

  constructor(service:SchemaService) {
    this.service = service
  }

  ngOnInit(): void {
    this.init()
    this.subscription = this.service
       .subscribe((loading:boolean) => {
         if (!loading)
          this.init()
       })
  }

  init() {
    let size = this.service.getSize()
    this.defs = [
      new DefinitionBlock(true, size.rows),
      new DefinitionBlock(false, size.cols)
    ]
    for (let def of this.service.defsGenerator()) {
      let block = this.defs[def.highlight.isHorizontal() ? 0 : 1]
      block.add(def)
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }
}
