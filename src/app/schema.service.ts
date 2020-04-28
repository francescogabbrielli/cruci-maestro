import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { skip } from 'rxjs/operators'

import { AuthService } from './auth.service'
import { BackendService } from './backend.service'

import { SchemaModel, Definition, Highlight, SchemaType } from './schema.model'


@Injectable({
  providedIn: 'root'
})
export class SchemaService {

  private auth:AuthService
  private be:BackendService

  model:SchemaModel

  private defs:{[index:string]:Definition} = {}
  private locked:{[index:string]:boolean} = {}
  private authorMode:boolean

  private loading:BehaviorSubject<boolean>

  readonly noSelection:Highlight = new Highlight(-1,-1,-1,-1)
  private selection:Highlight = this.noSelection

  private modified:boolean = false

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
      // console.log("USER CHANGED", user, this.auth.getUser() )
      let triggerLoad = this.authorMode === undefined || (!this.authorMode && user?.config.authorMode)
      //console.log("AUTHOR old =",this.authorMode, "; new =", user.config.authorMode)
      if (this.authorMode && !user.config.authorMode)
        this.clear()
      this.authorMode = user?.config.authorMode
      if (triggerLoad)
        this.load()
    })
    //this.updated.subscribe((v) => console.log("UPDATED", v))
  }

  subscribe(fn) {
    return this.loading.pipe(skip(1)).subscribe(fn)
  }

  setSelection(sel:Highlight):void {
    this.selection = sel
  }

  getSelection():Highlight {
    return this.selection
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
    this.modified = true
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
    this.modified = true
  }

  /** Determines if a cell is "locked" to show up in the solution mode */
  isCellLocked(i:number, j:number):boolean {
    return this.locked[i+"-"+j]===true
  }

  setHint(i:number, j:number, set:boolean):void {
    if (this.getCell(i,j)===' ' || !this.authorMode)
      return
    let k:string = i+"-"+j
    this.locked[k] = set
    let found = -1
    if (!(this.model.hints instanceof Array))
      this.model.hints = []
    for (let index=0; found<0 && index<this.model.hints.length; index++)
      if (k === this.model.hints[index][0]+"-"+this.model.hints[index][1])
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

  /**
   * Restituisce tutte le difinizioni contenute nella selezione passata
   */
  getDefs(selection?:Highlight):Definition[] {
    selection = selection || this.selection
    return this.authorMode || this.isType(SchemaType.Fixed)
      ? [this.defs[selection.toString()] || new Definition(selection)]
      : this.model.definitions.filter(def => selection.containsAll(def.highlight))
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

  clear():void {
    this.selection = this.noSelection
    this.setCells(this.create2DArray(...this.model.size))

    // locked cells
    this.locked = {}
    let array = this.model.hints instanceof Array ? this.model.hints : []
    if (!this.authorMode && this.model.type===SchemaType.Fixed && this.model.blocks instanceof Array)
      array = array.concat(this.model.blocks)
    for (let cell of array) {
      this.locked[cell[0]+"-"+cell[1]] = true
      this.setCell(...cell)
    }

    this.loading.next(false)
  }

  load():Promise<any> {

    this.loading.next(true)
    //console.log("LOADING", this.authorMode)

    return this.be.loadSchema(this.authorMode).then((model) => {

      this.selection = this.noSelection
      this.model = model

      //cells
      this.setCells(this.authorMode
        ? model.cells
        : this.create2DArray(...model.size))

      // locked cells
      this.locked = {}
      let array = this.model.hints instanceof Array ? this.model.hints : []
      if (!this.authorMode && this.model.type===SchemaType.Fixed && this.model.blocks instanceof Array)
        array = array.concat(this.model.blocks)
      for (let cell of array) {
        this.locked[cell[0]+"-"+cell[1]] = true
        this.setCell(...cell)
      }

      //definitions
      this.defs = {}
      let i = 0
      for (let d of model.definitions) {
        let h = new Highlight(d.highlight.start[0], d.highlight.start[1], d.highlight.end[0], d.highlight.end[1])
        d = new Definition(h, d)
        this.defs[h.toString()] = d
        this.model.definitions[i++] = d
      }

    })
    .catch(err => alert("Server error:" + err))
    .finally(() => {
      this.loading.next(false)
      this.modified = false
    })

  }

  save():Promise<any> {
    if (this.authorMode) {
      let defs = []
      let unused = false
      for (let def of this.defsGenerator(true)) {
        if (!def.unused)
          defs.push(def)
        else
          unused = true
      }
      this.model.definitions = defs
      return this.be.saveSchema(this.model).then(
          res => console.log(res),
          err => console.log(err)
        ).finally(() => this.modified = false)
      if (unused)
        alert("Attenzione! ci sono definizioni non utilizzate. Non verrano salvate")
    }
    return new Promise(null)
    // client.auth.loginWithCredential(new UserPasswordCredential("demo@francescogabbrielli.it", "demo20"))
    // .then((login) => {
    //   return db.collection('tests').updateOne({title: "test4"}, {$set: {owner_id: 'd', test: true}}, {upsert: true})
    // }).then(res => {
    //   console.log(res, btoa(JSON.stringify(this.cells)))
    // }).catch(err => {
    //   console.error(err)
    // })
  }

  check():Promise<any> {
    return this.be.check(this.model)
  }

  isAuthor():boolean {
    return this.auth && this.auth.getUserConfig().authorMode
  }

  isLoading():boolean {
    return this.loading.value
  }

  isModified():boolean {
    return this.modified
  }

}
