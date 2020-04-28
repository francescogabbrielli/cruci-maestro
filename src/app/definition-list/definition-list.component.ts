import { Component, OnInit, OnDestroy, EventEmitter, Input, Output } from '@angular/core'
import { Subscription } from 'rxjs/Subscription'

import { AuthService } from '../auth.service'
import { SchemaService } from '../schema.service'
import { Definition, SchemaType, Highlight } from '../schema.model'

class DefinitionBlock {
  title: string
  lines: Definition[][]
  horizontal:boolean
  random:boolean
  constructor(horizontal:boolean, size:number, random:boolean) {
    this.title = horizontal ? "Orizzontali" : "Verticali"
    this.lines = Array(size)
    this.horizontal = horizontal
    this.random = random
  }
  add(def:Definition):void {
    let dim = this.horizontal ? 0 : 1
    let high = def.highlight
    let index = this.random ? 0 : high.start[1-dim]
    let line = this.lines[index]
    if (!line) {
      line = [def]
    } else if (this.random) {
      line.splice(Math.floor(Math.random() * Math.floor(line.length)), 0, def)
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
    this.lines[index] = line
  }
}

@Component({
  selector: 'definition-list',
  templateUrl: './definition-list.component.html',
  styleUrls: ['./definition-list.component.sass']
})
export class DefinitionListComponent implements OnInit {

  private auth:AuthService
  private schema:SchemaService

  private subscription:Subscription

  defs:Array<DefinitionBlock>

  @Input()
  random:boolean

  @Output()
  selected:EventEmitter<Highlight> = new EventEmitter<Highlight>()


  show:number = 0

  visible:boolean = false
  single:boolean = false
  size:{rows: number, cols: number}

  constructor(auth:AuthService, schema:SchemaService) {
    this.auth = auth
    this.schema = schema
  }

  ngOnInit(): void {
    this.init()
    this.subscription = this.schema
       .subscribe((loading:boolean) => {
         if (!loading)
          this.init()
       })
  }

  init() {
    let size = this.schema.getSize()
    this.defs = [
      new DefinitionBlock(true, size.rows, this.random),
      new DefinitionBlock(false, size.cols, this.random)
    ]
    for (let def of this.schema.defsGenerator()) {
      let block = this.defs[def.highlight.isHorizontal() ? 0 : 1]
      block.add(def)
    }
    this.visible = this.random || this.auth.getUserConfig().authorMode || !this.schema.isType(SchemaType.Obliged)
    this.single = !this.schema.isType(SchemaType.Fixed)
    this.size = this.schema.getSize()
  }

  toggleBlock() {
    if (++this.show === this.defs.length)
      this.show = 0
  }

  toggleDefinition(d:Definition) {
    d.unused = !d.unused
  }

  setSelection(h:Highlight) {
    this.schema.setSelection(h)
    this.selected.emit(h)
  }

  setLineSelection(line:Definition[]) {
    let h = line[0].highlight
    h = h.isHorizontal()
      ? new Highlight(0, h.start[1], this.size.cols-1, h.end[1])
      : new Highlight(h.start[0], 0, h.end[0], this.size.rows-1)
    this.setSelection(h)
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }
}
