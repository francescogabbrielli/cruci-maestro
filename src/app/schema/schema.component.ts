import { Component, HostListener, EventEmitter, Input, Output, ViewChild } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { OnInit, OnChanges, SimpleChanges } from '@angular/core'
import { DragDropModule } from '@angular/cdk/drag-drop'
import { MatTooltip } from '@angular/material/tooltip'

import $ from "jquery"

import { Utils } from '../utils'
import { Config } from '../auth.service'
import { SchemaService } from '../schema.service'
import { SchemaModel, SchemaType, Highlight } from '../schema.model'
import { SchemaState } from './state'


class Tooltip {
  constructor(private schema: SchemaComponent) {
    let n = schema.tooltipData.n
    if (schema.tooltip === undefined)
      return
    schema.tooltip.hide()
    setTimeout(() => {
      schema.tooltipData.n++
      schema.tooltipData.def = schema.getDefinition()
    }, schema.tooltip.showDelay/2)
    setTimeout(() => schema.tooltip.show(), schema.tooltip.showDelay)
  }
}


@Component({
  selector: 'schema',
  templateUrl: './schema.component.html',
  styleUrls: ['./schema.component.sass']
})
export class SchemaComponent implements OnInit, OnChanges {

  private route:ActivatedRoute

  private service:SchemaService

  input:string
  cells:string[][]
  size:{rows:number, cols:number}
  cellSize:number

  private resizing:{rows:number, cols:number}
  private lastReframe:number = 0
  private dragPosition:{x:number, y:number}
  private dragging:boolean = false

  model:SchemaModel
  state:SchemaState

  @ViewChild('tooltip')
  tooltip:MatTooltip
  tooltipData:{def:string, n:number} = {def:'', n:0}

  @Input()
  selection:Highlight

  @Input()
  type:SchemaType

  @Input()
  config:Config

  @Output()
  selected:EventEmitter<Highlight> = new EventEmitter<Highlight>()

  @Output()
  stateChanged:EventEmitter<SchemaState> = new EventEmitter<SchemaState>()

  constructor(route:ActivatedRoute, service:SchemaService) {
    this.route = route
    this.service = service
    this.cells = this.service.create2DArray(999,999)
    this.state = {x:0, y:0, horizontal:true, focused:false, visible:false}
    this.selection = this.service.noSelection
  }

  ngOnInit() {
    //console.log("ON INIT")
    $(document).mousemove(event => this.resize(event))
    $(document).mouseup(event => this.prepareDrag(undefined, undefined, false, event))
  }

  init() {
    this.model = this.service.model
    this.cellSize = this.config.cellSize
    this.size = this.service.getSize()
    if (this.service.isLoading())
      return
    this.service.populate(this.cells)

    setTimeout(() => this.setCurrentHighlight(this.service.getSelection()), 100)

  }

  ngOnChanges(changes:SimpleChanges) {
    if (!this.service.isAuthor() && changes.type !== undefined && this.model !== undefined)
      this.service.clear()
    this.init()
  }

  reframe(s) {
    if (s.rows < 5 || s.cols < 5)
      return
    this.resizing = s
    let newCells = this.service.create2DArray(s.rows, s.cols)
    for(let i:number=0; i<s.rows; i++) {
      newCells[i] = []
      for(let j:number=0; j<s.cols; j++)
        try {
          newCells[i][j] = this.cells[i][j]
        } catch(error) {
          newCells[i][j] = " "
        }
    }
    this.service.setCells(newCells)
  }

  prepareDrag(i:number, j:number, activate:boolean, event) {

    if (i !== undefined && j !== undefined)
      this.moveCursor(j,i)

    //stop (previous) dragging
    if(this.dragging && !activate) {
      this.size = this.resizing
      if (this.state.x >= this.size.cols)
        this.state.x = this.size.cols-1
      if (this.state.y >= this.size.rows)
        this.state.y = this.size.rows-1
      //TODO: resize all definitions ending at a border!
      this.highlightCurrentWord()
    }

    //start dragging (only if author)
    if (this.config.authorMode) {
      this.dragging = activate
      this.dragPosition = {x: event.clientX, y: event.clientY}
    }

    event.preventDefault()

  }

  resize(event) {
    if (!this.dragging)
      return
    //console.log(event)
    let diffX = event.clientX-this.dragPosition.x
    let diffY = event.clientY-this.dragPosition.y
    let newSize = {
      rows: this.size.rows + Math.trunc(diffY/this.cellSize),
      cols: this.size.cols + Math.trunc(diffX/this.cellSize)
    }
    let t = new Date().getTime()
    if (newSize!==this.resizing && t > this.lastReframe+50) {
      this.selection = this.service.noSelection
      this.lastReframe = t
      this.reframe(newSize)
    }
  }

  getDefinition() {
    return this.type===SchemaType.Obliged && !this.config.authorMode
      ? ''
      : this.service.getDefs(this.selection).map(d=>d.desc).join(" - ")
  }

  setSelection(h:Highlight) {
    this.selection = h
    this.service.setSelection(h)

    //show tooltip definition (on mobile only?)
    if (Utils.isMobile())
      new Tooltip(this)

    this.selected.emit(h)
  }

  setCurrentHighlight(selection:Highlight):void {
    this.state.horizontal = selection.isHorizontal()
    let [x0, y0] =  [...selection.start]
    let [x1, y1] =  [...selection.end]
    this.moveCursor(x0, y0)
    console.log(selection)
    if (this.selection.start[0]!==x0 || this.selection.start[1]!==y0
      || this.selection.end[0]!==x1 || this.selection.end[1]!==y1) {
      let sel = new Highlight(x0, y0, x1, y1)
      sel.unused = true
      this.setSelection(sel)
    }
  }

  getCurrentHighlight(start: number, end: number):Highlight {
    return this.state.horizontal
        ? new Highlight(start, this.state.y, end, this.state.y)
        : new Highlight(this.state.x, start, this.state.x, end)
    }

  getNextPosition(direction:number):number[] {
    let initial = direction > 0
      ? [this.selection.end[0], this.selection.end[1]]
      : [this.selection.start[0], this.selection.start[1]]
    let index = this.state.horizontal ? 0 : 1
    let size = [this.size.cols, this.size.rows]
    let found = undefined
    let pos = initial
    do {
      pos[index] += direction
      if (pos[index] < 0 || pos[index] >= size[index]) {
        pos[index] = direction<0 ? size[index]-1 : 0
        pos[1-index] += direction
        found = undefined
      }
      if (pos[1-index]<0 || pos[1-index] >= size[1-index])
        break
      if (found!==undefined) {
        if (this.cells[pos[1]][pos[0]] !== '.')
          break
        found = undefined
      } else if (this.cells[pos[1]][pos[0]] !== '.')
        found = [pos[0], pos[1]]
    } while (true)
    return found || initial
  }

  highlightCurrentWord():void {
    if (!this.state.visible)
      return
    let highlight = this.highlightWord(this.state.x, this.state.y)
    if (!this.selection.equals(highlight))
      this.setSelection(highlight)
  }

  highlightWord(x0: number, y0: number):Highlight {
    let start=0, end=this.state.horizontal ? this.size.cols-1 : this.size.rows-1
    if (this.config.authorMode || this.service.isType(SchemaType.Fixed)) {
      start = this.state.horizontal ? x0 : y0
      end = this.state.horizontal ? x0 : y0
      let incX = this.state.horizontal ? 1 : 0
      let incY = this.state.horizontal ? 0 : 1
      for (let x=x0, y=y0; x>=0 && y>=0; x-=incX, y-=incY)
        if (this.cells[y][x]!=='.')
          start = this.state.horizontal ? x : y
        else break
      for (let x=x0, y=y0; x<this.size.cols && y<this.size.rows; x+=incX, y+=incY)
        if (this.cells[y][x]!=='.')
          end = this.state.horizontal ? x : y
        else break
    }
    return this.getCurrentHighlight(start, end)
  }

  moveCursor(x:number, y?:number) {

    $('.input').focus()

    if (y===undefined) {
      y = this.state.horizontal ? this.state.y : this.state.y+x
      x = this.state.horizontal ? this.state.x+x : this.state.x
    }

    this.state.visible = x>=0 && y>=0 && x<this.size.cols && y<this.size.rows
    if (!this.state.visible)
       return

    this.state.x = x
    this.state.y = y
    this.stateChanged.emit(this.state)

    let o = $('#cell-0-0').offset() || {left: 0, top:0}
    let offset = $('#cell-'+y+'-'+x).offset() || o
    let size = this.state.visible ? this.cellSize : 1
    $('.input').css({
      position: 'absolute',
      top: (offset.top-o.top)+'px',
      left: (offset.left-o.left)+'px',
      width: size+'px',
      height: size+'px'
    })

    this.highlightCurrentWord()

  }

  getCell() {
    return this.cells[this.state.y][this.state.x]
  }

  isLocked(i:number, j:number) {
    return this.service.isCellLocked(i, j)
  }

  setCell(value) {
    if (this.service.isCellLocked(this.state.y, this.state.x))
      return;
    if (!value)
      value = ' '
    if (value.length>1)
      value = value.charAt(0)
    let old = this.getCell()
    //console.log("SET", "|"+old+"|", "|"+value+"|")
    this.cells[this.state.y][this.state.x] = value
    this.service.setCell(this.state.y, this.state.x, value)
    if (old!==value && (old==="." || value===".")) {
      this.highlightCurrentWord()
      this.service.reDef(this.state.x, this.state.y, value===".")
    }
  }

  toggleOrientation(horizontal?:boolean) {
    if (horizontal == undefined || horizontal!==this.state.horizontal) {
      this.state.horizontal = !this.state.horizontal
      this.stateChanged.emit(this.state)
      this.highlightCurrentWord()
    }
  }

  onInputFocus($event) {
    this.state.focused = true
    $event.target.value = ''//this.getCell()
    //console.log("INPUT FOCUS")
    //$event.target.select()
  }

  onInputBlur() {
    //console.log("INPUT BLUR")
    this.state.focused = false
  }

  onInput($event) {
    //$event.target.select()
    //console.log("INPUT", $event)

    //blocks
    if (this.input===".") {
      if (this.config.authorMode || !this.service.isType(SchemaType.Fixed))
        this.setCell(".")
    //delete and go forward
    } else if (this.input===" ") {
      this.setCell(" ")
      this.moveCursor(1)
    //delete and stay
    } else if (Utils.isMobile() && this.input==="") {
      this.moveCursor(-1)
      this.setCell(" ")
    //insert char if not on a block and move forward
    } else if (this.input.match(/^[a-z]$/)) {
      if (this.getCell()!=='.') {//do not overwrite a block just by typing lowercase
        this.setCell(this.input.toUpperCase())
        this.moveCursor(1)
      }
      //$('.input').val(' ')
    //force insert char and stay
    } else if (this.input.match(/^[A-Z]$/)) {
      this.setCell(this.input)
      //$('.input').val(' ')
    } else if (this.input==='+') {
      this.service.setHint(this.state.y, this.state.x, true)
    } else if (this.input==='-') {
      this.service.setHint(this.state.y, this.state.x, false)
    }
    $('.input').val('')
    //console.log("INPUT: ", $event)
  }

  onKeyDown(event) {
    if (event.keyCode==8)
       return false
  }

  // //special keys (mainly works on PC only)
  @HostListener('window:keydown', ['$event'])
  keyDown(event: KeyboardEvent) {
    if (!this.state.focused)
      return true
    //console.log(event.key)
    if (event.key === "ArrowRight" || event.key === "Right") {
      this.moveCursor(this.state.x+1, this.state.y)
      //this.toggleOrientation(true)
      return false
    } else if (event.key === "ArrowLeft" || event.key === "Left") {
      this.moveCursor(this.state.x-1, this.state.y)
      //this.toggleOrientation(true)
      return false
    } else if (event.key === "ArrowDown" || event.key === "Down") {
      this.moveCursor(this.state.x, this.state.y+1)
      //this.toggleOrientation(false)
      return false
    } else if (event.key === "ArrowUp" || event.key === "Up") {
      this.moveCursor(this.state.x, this.state.y-1)
      //this.toggleOrientation(false)
      return false
    } else if (event.key === "Enter") {
      this.toggleOrientation()
    } else if (event.key === "Home") {
      this.moveCursor(this.selection.start[0], this.selection.start[1])
    } else if (event.key === "End") {
      this.moveCursor(this.selection.end[0], this.selection.end[1])
    } else if (event.key === "PageUp") {
      let p = this.getNextPosition(-1)
      this.moveCursor(p[0], p[1])
    } else if (event.key === "PageDown") {
      let p = this.getNextPosition(1)
      this.moveCursor(p[0], p[1])
    //delete char
    } else if (!Utils.isMobile() && event.key === "Delete") {
      this.setCell(" ")
    //delete char and move backward
    } else if (event.keyCode==8 || event.key === "Backspace") {
      this.moveCursor(-1)
      this.setCell(" ")
      return false
    }
  }

  toString() {
    return JSON.stringify(this.model)
  }

}
