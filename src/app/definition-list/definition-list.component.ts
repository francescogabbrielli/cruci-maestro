import { Component, OnInit } from '@angular/core';

import { SchemaService, Definition } from '../schema.service';

class DefinitionBlock {
  title: string;
  lines: Definition[][];
  horizontal:boolean;
  constructor(horizontal:boolean, size:number) {
    this.title = horizontal ? "Horizontals" : "Verticals";
    this.lines = Array(size);
    this.horizontal = horizontal;
  }
  add(def:Definition):void {
    let dim = this.horizontal ? 0 : 1;
    let high = def.highlight;
    let line = this.lines[high.start[1-dim]];
    if (!line) {
      line = [def];
    } else {
      for (var i=0; i<line.length; i++) {
        let h = line[i].highlight;
        if ((high.start[dim] < h.start[dim]) || (high.start[dim]===h.start[dim] && high.end[dim]<h.end[dim])) {
          line.splice(i, 0, def);
          break;
        }
      }
      if (i===line.length)
        line.push(def);
    }
    this.lines[high.start[1-dim]] = line;
  }
}

@Component({
  selector: 'definition-list',
  templateUrl: './definition-list.component.html',
  styleUrls: ['./definition-list.component.sass']
})
export class DefinitionListComponent implements OnInit {

  service:SchemaService;

  defs:Array<DefinitionBlock>;

  constructor(service:SchemaService) {
    this.service = service;
    let size = this.service.getSize();
    this.defs = [
      new DefinitionBlock(true, size[0]),
      new DefinitionBlock(false, size[1])
    ];
    for (let def of service.defsGenerator()) {
      let block = this.defs[def.highlight.isHorizontal() ? 0 : 1];
      block.add(def);
    }
  }

  ngOnInit(): void {

  }

}
