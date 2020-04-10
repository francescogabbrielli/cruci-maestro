import { Component, HostListener } from '@angular/core';
import { OnInit } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import $ from "jquery";

import { ConfigService } from '../config.service';
import { SchemaService, Highlight } from '../schema.service';

import { SchemaState } from './state';

@Component({
  selector: 'schema',
  templateUrl: './schema.component.html',
  styleUrls: ['./schema.component.sass']
})
export class SchemaComponent implements OnInit {

  config:ConfigService;
  service:SchemaService;

  cells:string[][];
  size:{rows:number, cols:number};

  resizing:{rows:number, cols:number};
  lastReframe:number                    = 0;
  dragPosition:{x:number, y:number};
  dragging:boolean                      = false;

  state: SchemaState = {x:0, y:0, horizontal: true, focused: false};
  selection: Highlight = new Highlight(0, 0, 0, 0);

  onFocus() {
    this.state.focused = true;
  }

  onBlur() {
    this.state.focused = false;
  }

  constructor(config:ConfigService, service:SchemaService) {
    this.config = config;
    this.service = service;
    this.cells = this.service.create2DArray(999,999);
    this.size = {
      rows: this.service.cells.length,
      cols: this.service.cells[0].length
    };
  }

  ngOnInit() {
    this.reframe(this.size);
    $(document).mousemove(event=>this.resize(event));
    $(document).mouseup(event=>this.prepareDrag(undefined, undefined, false, event));
    this.highlightCurrentWord();
  }

  reframe(s) {
    if (s.rows < 5 || s.cols < 5)
      return;
    this.resizing = s;
    let newCells = this.service.create2DArray(s.rows, s.cols);
    for(let i:number=0; i<s.rows; i++) {
      newCells[i] = [];
      for(let j:number=0; j<s.cols; j++)
        try {
          newCells[i][j] = this.cells[i][j];
        } catch(error) {
          newCells[i][j] = " ";
        }
    }
    this.service.cells = newCells;
  }

  prepareDrag(i:number, j:number, activate:boolean, event) {

    if (i !== undefined && j !== undefined)
      this.moveCursor(j,i);

    //stop dragging
    if(this.dragging && !activate) {
      this.size = this.resizing;
      //console.log("RESIZE", this.size);
      if (this.state.x >= this.size.cols)
        this.state.x = this.size.cols-1;
      if (this.state.y >= this.size.rows)
        this.state.y = this.size.rows-1;
      this.highlightCurrentWord();
    }

    this.dragging = activate;
    this.dragPosition = {x: event.clientX, y: event.clientY};

    if (activate)
      this.selection = undefined;

  }

  resize(event) {
    if (!this.dragging)
      return;
    //console.log(event);
    let diffX = event.clientX-this.dragPosition.x;
    let diffY = event.clientY-this.dragPosition.y;
    let newSize = {
      rows: this.size.rows + Math.trunc(diffY/this.config.cellSize),
      cols: this.size.cols + Math.trunc(diffX/this.config.cellSize)
    };
    let t = new Date().getTime();
    if (newSize!==this.resizing && t > this.lastReframe+50) {
      this.lastReframe = t;
      this.reframe(newSize);
    }
  }

  getCurrentHighlight(start: number, end: number):Highlight {
    return this.state.horizontal
      ? new Highlight(start, this.state.y, end, this.state.y)
      : new Highlight(this.state.x, start, this.state.x, end);
  }

  highlightCurrentWord() {
    let start, end;
    let incX = this.state.horizontal ? 1 : 0;
    let incY = this.state.horizontal ? 0 : 1;
    for (let x=this.state.x, y=this.state.y; x>=0 && y>=0; x-=incX, y-=incY)
      if (this.cells[y][x]!=='.')
        start = this.state.horizontal ? x : y;
      else break;
    for (let x=this.state.x, y=this.state.y; x<this.size.cols && y<this.size.rows; x+=incX, y+=incY)
      if (this.cells[y][x]!=='.')
        end = this.state.horizontal ? x : y;
      else break;
    let highlight = this.getCurrentHighlight(start, end);
    if (!this.selection || !this.selection.equals(highlight))
      this.selection = highlight;
  }

  moveCursor(x:number, y?:number) {
    if (y===undefined) {
      y = this.state.horizontal ? this.state.y : this.state.y+x;
      x = this.state.horizontal ? this.state.x+x : this.state.x;
    }
    // let highlight = x!==this.state.x && y!==this.state.y;
    // if (!highlight && this.getCell() === ".")
    //   highlight = true;
    if (x<0 || x>=this.size.cols || y<0 || y>=this.size.rows)
      return;
    this.state.x = x;
    this.state.y = y;
    //if (highlight || this.getCell() === ".")
      this.highlightCurrentWord();
  }

  getCell() {
    return this.cells[this.state.y][this.state.x];
  }

  setCell(value) {
    let old = this.getCell();
    this.cells[this.state.y][this.state.x] = value;
    this.service.setCell(this.state.y, this.state.x, value);
    if (old!==value && (old==="." || value===".")) {
      this.highlightCurrentWord();
      this.service.reDef(this.state.x, this.state.y, old===".")
    }
  }

  toggleOrientation(horizontal?:boolean) {
    if (horizontal == undefined || horizontal!==this.state.horizontal) {
      this.state.horizontal = !this.state.horizontal;
      this.highlightCurrentWord();
    }
  }

  //repeatable keys
  @HostListener('window:keydown', ['$event'])
  keyDown(event: KeyboardEvent) {
    if (!this.state.focused)
      return true;
    //console.log(event.key);
    if (event.key === "ArrowRight") {
      this.moveCursor(this.state.x+1, this.state.y);
      //this.toggleOrientation(true);
    } else if (event.key === "ArrowLeft") {
      this.moveCursor(this.state.x-1, this.state.y);
      //this.toggleOrientation(true);
    } else if (event.key === "ArrowDown") {
      this.moveCursor(this.state.x, this.state.y+1);
      //this.toggleOrientation(false);
    } else if (event.key === "ArrowUp") {
      this.moveCursor(this.state.x, this.state.y-1);
      //this.toggleOrientation(false);
    } else if (event.key === "Enter") {
      this.toggleOrientation();
    } else if (event.key === " ") {
      this.setCell(" ");
      this.moveCursor(1);
    } else if (event.keyCode==8 || event.key === "Backspace") {
      this.moveCursor(-1);
      this.setCell(" ");
      return false;
    } else if (event.key === "Delete") {
      this.setCell(" ");
    }
  }

  //non-repeatable keys
  @HostListener('window:keyup', ['$event'])
  keyUp(event: KeyboardEvent) {

    if (!this.state.focused)
      return true;

    if (event.key===".") {
      this.setCell(event.key);
    } else if (event.key.match(/^[a-z]$/)) {
      this.setCell(event.key.toUpperCase());
      this.moveCursor(1);
    } else if (event.key.match(/^[A-Z]$/)) {
      this.setCell(event.key.toUpperCase());
    }
  }

}