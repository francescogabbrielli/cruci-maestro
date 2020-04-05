import { Component } from '@angular/core';
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

  ngOnInit() {
    this.reframe(this.size);
    $(document).mousemove(event=>this.resize(event));
    $(document).mouseup(event=>this.prepareDrag(false, event));
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
    if (newSize!=this.resizing && t > this.lastReframe+50) {
      this.lastReframe = t;
      this.reframe(newSize);
    }
  }

}
