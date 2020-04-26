import { Component, HostListener, EventEmitter, Input, Output } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core'
import { DragDropModule } from '@angular/cdk/drag-drop'

import {Subscription} from 'rxjs/Subscription'
import $ from "jquery"

import { Config } from '../auth.service'
import { SchemaService } from '../schema.service'
import { SchemaModel, SchemaType, Highlight } from '../schema.model'
import { SchemaState } from './state'

@Component({
  selector: 'schema',
  templateUrl: './schema.component.html',
  styleUrls: ['./schema.component.sass']
})
export class SchemaComponent implements OnInit, OnDestroy, OnChanges {

  readonly touchDevice = navigator.maxTouchPoints || 'ontouchstart' in document.documentElement

  private route:ActivatedRoute

  private service:SchemaService

  private subscription:Subscription

  input:string
  cells:string[][]
  size:{rows:number, cols:number}
  cellSize:number

  private resizing:{rows:number, cols:number}
  private lastReframe:number = 0
  private dragPosition:{x:number, y:number}
  private dragging:boolean = false

  model: SchemaModel
  state: SchemaState

  @Input()
  selection: Highlight

  sel:string

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
    this.state = {x:0, y:0, horizontal:true, focused:false}
    this.selection = this.service.getSelection()
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
    this.setCurrentHighlight(this.service.getSelection())
    this.stateChanged.emit(this.state)
    $('.input').focus()
  }

  ngOnDestroy() {
    //this.subscription.unsubscribe()
  }

  ngOnChanges(changes:SimpleChanges) {
    //console.log("CHANGES", changes, this.service.loading)
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
      if (activate)
        this.selection = this.service.noSelection
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
      this.lastReframe = t
      this.reframe(newSize)
    }
  }

  setSelection(h:Highlight) {
    this.selection = h
    this.service.setSelection(h)
    this.selected.emit(h)
  }

  setCurrentHighlight(selection:Highlight):void {
    this.state.horizontal = selection.isHorizontal()
    let [x0, y0] =  [...selection.start]
    let [x1, y1] =  [...selection.end]
    this.moveCursor(x0, y0)
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

  highlightCurrentWord() {
    let start=0, end=this.state.horizontal ? this.size.cols-1 : this.size.rows-1
    if (this.config.authorMode || this.service.isType(SchemaType.Fixed)) {
      start = undefined
      end = undefined
      let incX = this.state.horizontal ? 1 : 0
      let incY = this.state.horizontal ? 0 : 1
      for (let x=this.state.x, y=this.state.y; x>=0 && y>=0; x-=incX, y-=incY)
        if (this.cells[y][x]!=='.')
          start = this.state.horizontal ? x : y
        else break
      for (let x=this.state.x, y=this.state.y; x<this.size.cols && y<this.size.rows; x+=incX, y+=incY)
        if (this.cells[y][x]!=='.')
          end = this.state.horizontal ? x : y
        else break
    }
    let highlight = this.getCurrentHighlight(start, end)
    if (!this.selection.equals(highlight))
      this.setSelection(highlight)
  }

  moveCursor(x:number, y?:number) {
    if (y===undefined) {
      y = this.state.horizontal ? this.state.y : this.state.y+x
      x = this.state.horizontal ? this.state.x+x : this.state.x
    }
    if (x<0 || x>=this.size.cols || y<0 || y>=this.size.rows)
      return

    this.state.x = x
    this.state.y = y
    this.stateChanged.emit(this.state)

    this.highlightCurrentWord()
    this.fixFocus()
  }

  fixFocus() {
    $('.input').val(this.getCell()).select()
    setTimeout(() => $('.input').focus(), 100)
  }

  getCell() {
    return this.cells[this.state.y][this.state.x]
  }

  setCell(value) {
    if (this.service.isCellLocked(this.state.y, this.state.x))
      return;
    let old = this.getCell()
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
    $event.target.value = this.getCell()
    $event.target.select()
  }

  onInputBlur() {
    this.state.focused = false
  }

  onInput($event) {
    $event.target.select()

    //blocks
    if (this.input===".") {
      if (this.config.authorMode || !this.service.isType(SchemaType.Fixed))
        this.setCell(".")
    //delete and go forward
    } else if (this.input===" ") {
      this.setCell(" ")
      this.moveCursor(1)
    //delete and stay
    } else if (this.input==="") {
      if (this.touchDevice)
        this.moveCursor(-1)
      this.setCell(" ")
      this.fixFocus()
      //$event.target.select()
      //$event.target.value = this.getCell()
    //insert char if not on a block and move forward
    } else if (this.input.match(/^[a-z]$/)) {
      if (this.getCell()!=='.') {//do not overwrite a block just by typing lowercase
        this.setCell(this.input.toUpperCase())
        this.moveCursor(1)
      }
    //force insert char and stay
    } else if (this.input.match(/^[A-Z]$/)) {
      this.setCell(this.input)
    }
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
    if (event.key === "ArrowRight") {
      this.moveCursor(this.state.x+1, this.state.y)
      //this.toggleOrientation(true)
      return false
    } else if (event.key === "ArrowLeft") {
      this.moveCursor(this.state.x-1, this.state.y)
      //this.toggleOrientation(true)
      return false
    } else if (event.key === "ArrowDown") {
      this.moveCursor(this.state.x, this.state.y+1)
      //this.toggleOrientation(false)
      return false
    } else if (event.key === "ArrowUp") {
      this.moveCursor(this.state.x, this.state.y-1)
      //this.toggleOrientation(false)
      return false
    } else if (event.key === "Enter") {
      this.toggleOrientation()
    } else if (event.key === "Home") {
      this.moveCursor(0, 0)
    } else if (event.key === "End") {
      this.moveCursor(this.size.cols-1, this.size.rows-1)
    //delete char and move backward
    } else if (event.keyCode==8 || event.key === "Backspace") {
      this.moveCursor(-1)
      this.setCell(" ")
      return false
    }
  }

}
