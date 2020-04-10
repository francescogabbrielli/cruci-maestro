import { Component, OnInit, OnChanges, Input } from '@angular/core';

import { SchemaService, Definition, Highlight } from '../schema.service';

import { SchemaState } from '../schema/state';


@Component({
  selector: 'defs',
  templateUrl: './defs.component.html',
  styleUrls: ['./defs.component.sass']
})
export class DefsComponent implements OnInit, OnChanges {

  service: SchemaService;

  @Input()
  state: SchemaState;

  @Input()
  selection: Highlight;

  def: Definition;

  constructor(service: SchemaService) {
    this.service = service;
  }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
    this.def = this.service.getDef(this.selection);
  }

  onChange():void {
    this.service.setDef(this.def);
  }
}
