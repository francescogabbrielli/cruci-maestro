export class Highlight {
  start: [number, number];
  end: [number, number];
  unused?:boolean;

  constructor(s0:number, s1:number, e0:number, e1:number) {
    this.start = [s0, s1];
    this.end = [e0, e1];
  }
  isHorizontal():boolean {
    return this.start[1] === this.end[1];
  }
  equals(h:Highlight) {
    return h ? this.start[0] === h.start[0] && this.start[1] === h.start[1] && this.end[0] === h.end[0] && this.end[1] === h.end[1] : false;
  }
  startsWith(x:number, y:number) {
    return this.start[0] === x && this.start[1] === y;
  }
  endsWith(x: number, y: number) {
    return this.end[0] === x && this.end[1] === y;
  }
  contains(x: number, y: number) {
    return (this.start[0] === x && this.end[0] === x && y >= this.start[1] && y <= this.end[1]) || (this.start[1] === y && this.end[1] === y && x >= this.start[0] && x <= this.end[0]);
  }
  length():number {
    return this.end[1]-this.start[1] + this.end[0]-this.start[0] + 1 || 0;
  }
  toString():string {
    return this.start[0]+"-"+this.start[1]+"-"+this.end[0]+"-"+this.end[1];
  }
}

export class Definition {
  desc:string;
  unused:boolean;
  isnew:boolean;
  highlight?:Highlight;

  constructor(highlight:Highlight) {
    this.desc = "";
    this.unused = false;
    this.isnew = true;
    this.highlight = highlight;
  }
}

export enum SchemaType {
  Fixed   = "fixed",
  Free    = "free",
  Obliged = "obliged"
};

export interface SchemaModel {
  id?:string;
  title:string;
  cells?:string[][];
  definitions:Definition[];
  type:SchemaType;
  size:[number, number];
}
