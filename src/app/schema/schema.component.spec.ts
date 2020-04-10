import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { DragDropModule } from '@angular/cdk/drag-drop';
import $ from "jquery";

import { SchemaComponent } from './schema.component';

describe('AppComponent', () => {

  let component: SchemaComponent;
  let fixture: ComponentFixture<SchemaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [

      ],
      declarations: [
        SchemaComponent
      ],
    }).compileComponents();
  }));

  it('should create the component', () => {
    const fixture = TestBed.createComponent(SchemaComponent);
    const schema = fixture.componentInstance;
    fixture.detectChanges();
    expect(schema).toBeTruthy();
    expect(schema.cells.length).toEqual(10);
  });

  it('should reframe the schema', () => {
    const fixture = TestBed.createComponent(SchemaComponent);
    const schema = fixture.componentInstance;
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector("#cell-19-24")).toBeNull();
    schema.reframe({rows: 20, cols: 25});
    fixture.detectChanges();
    expect(compiled.querySelector("#cell-19-24").className).toContain("cell");
  });

  

});
