import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeGlobaleComponent } from './liste-globale.component';

describe('ListeGlobaleComponent', () => {
  let component: ListeGlobaleComponent;
  let fixture: ComponentFixture<ListeGlobaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeGlobaleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListeGlobaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
