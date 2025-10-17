import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashActiviteComponent } from './dash-activite.component';

describe('DashActiviteComponent', () => {
  let component: DashActiviteComponent;
  let fixture: ComponentFixture<DashActiviteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashActiviteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashActiviteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
