import { TestBed, async, ComponentFixture } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { LayoutModule } from '@angular/cdk/layout'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { MatCardModule } from '@angular/material/card'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatToolbarModule } from '@angular/material/toolbar'

import { AppComponent } from './app.component'
import { SchemaComponent } from './schema/schema.component'

describe('AppComponent', () => {

  let component: AppComponent
  let fixture: ComponentFixture<AppComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        NoopAnimationsModule,
        LayoutModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatSidenavModule,
        MatToolbarModule,
      ],
      declarations: [
        AppComponent,
        SchemaComponent
      ],
    }).compileComponents()
  }))

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent)
    const app = fixture.componentInstance
    expect(app).toBeTruthy()
  })

  it('should render table schema', () => {
    const fixture = TestBed.createComponent(AppComponent)
    fixture.detectChanges()
    const compiled = fixture.nativeElement
    expect(compiled.querySelector('table').className).toEqual('schema noselect')
  })
})
