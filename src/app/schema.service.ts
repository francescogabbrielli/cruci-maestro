import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs/Subscription';

import { AuthService } from './auth.service';
import { BackendService } from './backend.service';

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

interface DefArray {
  [index:string]:Definition;
}

@Injectable({
  providedIn: 'root'
})
export class SchemaService {

  private auth:AuthService;
  private be:BackendService;

  private id:string;

  title:string;

  cells:string[][];

  defs:DefArray;

  updated:BehaviorSubject<boolean>;

  private userSubscription:Subscription;

  readonly noSelection:Highlight = new Highlight(-1,-1,-1,-1);

  constructor(auth:AuthService, be:BackendService) {
    this.auth = auth;
    this.be = be;
    this.cells = this.create2DArray(10, 10);
    this.defs = {};
    //this.userSubscription = this.auth.subscribe(item => {
    this.load();
    ///});
    this.updated = new BehaviorSubject<boolean>(false);
  }

  create2DArray(rows:number, cols:number):string[][] {
    let ret:string[][] = Array<Array<string>>(rows).fill([]);
    for (let row in ret)
      ret[row] = Array<string>(cols).fill(" ");
    return ret;
  }

  set(cells:string[][]):void {
    this.cells = cells;
  }

  populate(cells:string[][]):void {
    for (let i=0; i<this.cells.length; i++)
      for (let j=0; j<this.cells[i].length; j++)
        cells[i][j] = this.cells[i][j];
  }

  getCell(i:number, j:number):string {
    return this.cells[i][j];
  }

  setCell(i:number, j:number, value:string):void {
    this.cells[i][j] = value;
  }

  getSize():[number,number] {
    return [this.cells.length, this.cells[0].length];
  }

  setDef(def:Definition) {
    //inserimento
    let index = def.highlight.toString();
    if (def.desc && def.isnew) {
      this.defs[index] = def;
      def.isnew = false;
    }
    //cancellazione
    else if (!def.desc && !def.isnew) {
      delete this.defs[index];
    }
  }

  getDef(selection:Highlight):Definition {
    selection = selection || this.noSelection;
    return this.defs[selection.toString()] || new Definition(selection);
  }

  *defsGenerator():IterableIterator<Definition> {
    let keys:string[] = Object.keys(this.defs);
    let step:number = 0;
    while (step < keys.length)
      yield this.defs[keys[step++]];
  }

  /********************************************************
   *  Recompute definitions at (x,y) because of a new block
   *  either being added or removed.
   *  => mark them as used or unused
   */
  reDef(x:number, y:number, blockAdded:boolean) {
    for (let def of this.defsGenerator())
      if (def.highlight.contains(x, y)) {
        def.unused = blockAdded;
      } else if (def.highlight.start[1] === y && def.highlight.end[1] === y) {
        if (def.highlight.start[0] === x+1 || def.highlight.end[0] === x-1)
          def.unused = !blockAdded;
      } else if (def.highlight.start[0] === x && def.highlight.end[0] === x) {
        if (def.highlight.start[1] === y+1 || def.highlight.end[1] === y-1)
          def.unused = !blockAdded;
      }
  }

  load() {

    let load;
    //if (this.auth.getUserConfig().authorMode)
      load = this.be.loadSchema();
    //else
      //return;

    load.then(doc => {
      this.id = doc._id.toString();
      this.cells = JSON.parse(atob(doc["cells"]));
      this.defs = {};
      for (let d of doc["definitions"]) {
        let h = new Highlight(d.highlight.start[0], d.highlight.start[1], d.highlight.end[0], d.highlight.end[1]);
        let def = new Definition(h);
        def.desc = d.desc;
        def.unused = d.unused;
        def.isnew = false;
        this.defs[h.toString()] = def;
      }
      this.title = doc["title"];
      this.updated.next(true);
    }).catch(err => {
      console.error(err)
    });

  }

  save() {
    if (this.auth.isLogged()) {
      let cells = btoa(JSON.stringify(this.cells));
      let user = this.auth.getUser();
      let defs = [];
      let unused = false;
      for (let def of this.defsGenerator())
        if (!def.unused)
          defs.push(def);
        else
          unused = true;
      this.be.saveSchema(this.id, cells, defs).then(
          res => console.log(res),
          err => console.log(err)
        );
      if (unused)
        alert("Attenzione! ci sono definizione non utilizzate. Non verrano salvate");
    }
    // client.auth.loginWithCredential(new UserPasswordCredential("demo@francescogabbrielli.it", "demo20"))
    // .then((login) => {
    //   return db.collection('tests').updateOne({title: "test4"}, {$set: {owner_id: 'd', test: true}}, {upsert: true})
    // }).then(res => {
    //   console.log(res, btoa(JSON.stringify(this.cells)));
    // }).catch(err => {
    //   console.error(err);
    // });
  }
}
