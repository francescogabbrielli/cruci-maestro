import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { skip } from 'rxjs/operators'

import { AuthService } from './auth.service'
import { BackendService } from './backend.service'

import { SchemaModel, Definition, Highlight, SchemaType } from './schema.model'


interface DefArray {
  [index:string]:Definition
}


@Injectable({
  providedIn: 'root'
})
export class SchemaService {

  private auth:AuthService
  private be:BackendService

  model:SchemaModel

  private defs:DefArray = {}
  private locked:{[index:string]:boolean} = {}

  private loading:BehaviorSubject<boolean>

  readonly noSelection:Highlight = new Highlight(-1,-1,-1,-1)

  constructor(auth:AuthService, be:BackendService) {
    this.auth = auth
    this.be = be

    this.model = {
      title: '',
      type: SchemaType.Fixed,
      definitions: [],
      size: [10, 10]
    }

    this.setCells(this.create2DArray(...this.model.size))

    this.loading = new BehaviorSubject<boolean>(false)
    this.auth.subscribe(user => {
      console.log("USER CHANGED", user )
      this.load()
    })
    //this.updated.subscribe((v) => console.log("UPDATED", v))
  }

  subscribe(fn) {
    return this.loading.pipe(skip(1)).subscribe(fn)
  }

  create2DArray(...dimensions:number[]):string[][]
  create2DArray(rows:number, cols:number):string[][] {
    let ret:string[][] = Array<Array<string>>(rows).fill([])
    for (let row in ret)
      ret[row] = Array<string>(cols).fill(" ")
    return ret
  }

  setCells(cells:string[][]):void {
    this.model.cells = cells
    this.model.size = [cells.length, cells[0].length]
  }

  populate(cells:string[][]):void {
    for (let i=0; i<this.model.cells.length; i++)
      for (let j=0; j<this.model.cells[i].length; j++)
        cells[i][j] = this.model.cells[i][j]
  }

  getSize():{rows:number, cols:number} {
    return {
      rows: this.model.size[0],
      cols: this.model.size[1]
    }
  }

  getCell(i:number, j:number):string {
    return this.model.cells[i][j]
  }

  setCell(...params:any[]):void
  setCell(i:number, j:number, value:string):void {
    this.model.cells[i][j] = value
  }

  /** Determines if a cell is "locked" to show up in the solution mode */
  isCellLocked(i:number, j:number):boolean {
    return this.locked[i+"-"+j]===true
  }

  setHint(i:number, j:number, set:boolean):void {
    let k:string = i+"-"+j
    this.locked[k] = set
    let found = -1
    if (!(this.model.hints instanceof Array))
      this.model.hints = []
    for (let index=0; found<0 && index<this.model.hints.length; index++)
      if (k === this.model.hints[0]+"-"+this.model.hints[1])
        found = index
    if (!set && found>=0)
      this.model.hints.splice(found, 1)
    else if (set && found<0)
      this.model.hints.push([i, j, this.getCell(i,j)])
  }

  isType(type:SchemaType):boolean {
    return this.model.type===type
  }

  setType(type:SchemaType):void {
    this.model.type = type
  }

  setDef(def:Definition) {
    //inserimento
    let index = def.highlight.toString()
    if (def.desc && def.isnew) {
      this.defs[index] = def
      def.isnew = false
    }
    //cancellazione
    else if (!def.desc && !def.isnew) {
      delete this.defs[index]
    }
  }

  getDef(selection:Highlight):Definition {
    selection = selection || this.noSelection
    return this.defs[selection.toString()] || new Definition(selection)
  }

  *defsGenerator(sorted = false):IterableIterator<Definition> {
    let keys:string[] = Object.keys(this.defs)
    if (sorted)
      keys = keys.sort()
    let step:number = 0
    while (step < keys.length)
      yield this.defs[keys[step++]]
  }

  /********************************************************
   *  Recompute definitions at (x,y) because of a new block
   *  either being added or removed.
   *  => mark them as used or unused
   */
  reDef(x:number, y:number, blockAdded:boolean) {
    for (let def of this.defsGenerator())
      if (def.highlight.contains(x, y)) {
        def.unused = blockAdded
      } else if (def.highlight.start[1] === y && def.highlight.end[1] === y) {
        if (def.highlight.start[0] === x+1 || def.highlight.end[0] === x-1)
          def.unused = !blockAdded
      } else if (def.highlight.start[0] === x && def.highlight.end[0] === x) {
        if (def.highlight.start[1] === y+1 || def.highlight.end[1] === y-1)
          def.unused = !blockAdded
      }
  }

  isLoading() {
    return this.loading.value
  }

  load() {

    this.loading.next(true)
    //console.log("LOADING", this.auth.getUserConfig().authorMode)

    this.be.loadSchema(this.auth.getUserConfig().authorMode).then((model) => {

      this.model = model

      //cells
      this.setCells(this.auth.getUserConfig().authorMode
        ? model.cells
        : this.create2DArray(...model.size))

      // locked cells
      this.locked = {}
      let array = this.model.hints instanceof Array ? this.model.hints : []
      if (!this.auth.getUserConfig().authorMode && this.model.type===SchemaType.Fixed && this.model.blocks instanceof Array)
        array = array.concat(this.model.blocks)
      for (let cell of array) {
        this.locked[cell[0]+"-"+cell[1]] = true
        this.setCell(...cell)
      }

      //definitions
      this.defs = {}
      for (let d of model.definitions) {
        let h = new Highlight(d.highlight.start[0], d.highlight.start[1], d.highlight.end[0], d.highlight.end[1])
        this.defs[h.toString()] = new Definition(h, d)
      }

    })
    .catch(err => console.error(err))
    .finally(() => this.loading.next(false))

  }

  save() {
    if (this.auth.getUserConfig().authorMode) {
      this.model.type = SchemaType[this.auth.getUserConfig().solutionType]//TODO: just use schema model
      let defs = []
      let unused = false
      for (let def of this.defsGenerator(true)) {
        if (!def.unused)
          defs.push(def)
        else
          unused = true
      }
      this.model.definitions = defs
      this.be.saveSchema(this.model).then(
          res => console.log(res),
          err => console.log(err)
        )
      if (unused)
        alert("Attenzione! ci sono definizioni non utilizzate. Non verrano salvate")
    }
    // client.auth.loginWithCredential(new UserPasswordCredential("demo@francescogabbrielli.it", "demo20"))
    // .then((login) => {
    //   return db.collection('tests').updateOne({title: "test4"}, {$set: {owner_id: 'd', test: true}}, {upsert: true})
    // }).then(res => {
    //   console.log(res, btoa(JSON.stringify(this.cells)))
    // }).catch(err => {
    //   console.error(err)
    // })
  }
}
