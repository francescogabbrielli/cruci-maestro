import { Component, HostListener } from '@angular/core';
import { OnInit } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import $ from "jquery";

@Component({
  selector: 'schema',
  templateUrl: './schema.component.html',
  styleUrls: ['./schema.component.less']
})
export class SchemaComponent implements OnInit {
  cellSize:number                       = 32;
  size:{rows:number, cols:number}      = {rows: 10, cols: 10};
  resizing:{rows:number, cols:number};
  cells:string[][]                      = [];
  lastReframe:number                    = 0;
  dragPosition:{x:number, y:number};
  dragging:boolean                      = false;
  state:{
    x:number,
    y:number
    horizontal:boolean,
    start:number,
    end:number
  } = {x:0, y:0, horizontal: true, start: 0, end: this.size.cols-1};

  ngOnInit() {
    this.reframe(this.size);
    $(document).mousemove(event=>this.resize(event));
    $(document).mouseup(event=>this.prepareDrag(false, event));
    this.highlightCurrentWord();
  }

  reframe(s) {
    if (s.rows < 5 || s.cols < 5)
      return;
    this.resizing = s;
    let newCells = [];
    for(let i:number=0; i<s.rows; i++) {
      newCells[i] = [];
      for(let j:number=0; j<s.cols; j++)
        try {
          newCells[i][j] = this.cells[i][j];
        } catch(error) {
          newCells[i][j] = " ";
        }
    }
    this.cells = newCells;
  }

  prepareDrag(activate:boolean, event) {
    //stop dragging
    if(this.dragging && !activate) {
      this.size = this.resizing;
      console.log("RESIZE", this.size);
    }
    this.dragging = activate;
    this.dragPosition = {x: event.clientX, y: event.clientY};
  }

  resize(event) {
    if (!this.dragging)
      return;
    console.log(event);
    let diffX = event.clientX-this.dragPosition.x;
    let diffY = event.clientY-this.dragPosition.y;
    let newSize = {
      rows: this.size.rows + Math.trunc(diffY/this.cellSize),
      cols: this.size.cols + Math.trunc(diffX/this.cellSize)
    };
    let t = new Date().getTime();
    if (newSize!==this.resizing && t > this.lastReframe+50) {
      this.lastReframe = t;
      this.reframe(newSize);
    }
  }

  highlightCurrentWord() {
    let start, end;
    if (this.state.horizontal) {
      start = this.state.x;
      for (let i=this.state.x; i>=0; i--)
        if (this.cells[this.state.y][i]==='.')
          break;
        else start = i;
      for (let i=this.state.x; i<this.size.cols; i++)
        if (this.cells[this.state.y][i]==='.')
          break;
        else end = i;
    } else {
      for (let i=this.state.y; i>=0; i--)
        if (this.cells[i][this.state.x]==='.')
          break;
        else start = i;
      for (let i=this.state.y; i<this.size.rows; i++)
        if (this.cells[i][this.state.x]==='.')
          break;
        else end = i;
    }
    this.state.start = start;
    this.state.end = end;
  }

  moveCursor(x:number, y:number) {
    let highlight = x!==this.state.x && y!==this.state.y;
    if (!highlight && this.cells[this.state.y][this.state.x] === ".")
      highlight = true;
    if (x>=0 && x<this.size.cols && y>=0 && y<this.size.rows) {
      this.state.x = x;
      this.state.y = y;
    }
    if (!highlight && this.cells[this.state.y][this.state.x] === ".")
      highlight = true;
    if (highlight)
      this.highlightCurrentWord();
  }

  toggleOrientation(horizontal?:boolean) {
    if (horizontal == undefined || horizontal!==this.state.horizontal) {
      this.state.horizontal = !this.state.horizontal;
      this.highlightCurrentWord();
    }
  }

  @HostListener('window:keydown', ['$event'])
  keyDown(event: KeyboardEvent) {
    if (event.key === "ArrowRight") {
      this.moveCursor(this.state.x+1, this.state.y);
      this.toggleOrientation(true);
    }
    else if (event.key === "ArrowLeft") {
      this.moveCursor(this.state.x-1, this.state.y);
      this.toggleOrientation(true);
    }
    else if (event.key === "ArrowDown") {
      this.moveCursor(this.state.x, this.state.y+1);
      this.toggleOrientation(false);
    }
    else if (event.key === "ArrowUp") {
      this.moveCursor(this.state.x, this.state.y-1);
      this.toggleOrientation(false);
    }
    else if (event.key === "Enter") {
      this.toggleOrientation();
    }
  }

  @HostListener('window:keyup', ['$event'])
  keyUp(event: KeyboardEvent) {
    if (event.key===".") {
      this.cells[this.state.y][this.state.x] = event.key;
      this.highlightCurrentWord();
    } else if (event.key.match(/^[a-zA-Z]$/)) {
      this.cells[this.state.y][this.state.x] = event.key.toUpperCase();
    }
  }

}
