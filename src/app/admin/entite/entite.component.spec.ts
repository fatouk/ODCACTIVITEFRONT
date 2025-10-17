import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntiteComponent } from './entite.component';

describe('EntiteComponent', () => {
  let component: EntiteComponent;
  let fixture: ComponentFixture<EntiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntiteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
