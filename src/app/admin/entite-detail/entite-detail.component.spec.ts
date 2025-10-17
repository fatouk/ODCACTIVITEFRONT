import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntiteDetailComponent } from './entite-detail.component';

describe('EntiteDetailComponent', () => {
  let component: EntiteDetailComponent;
  let fixture: ComponentFixture<EntiteDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntiteDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntiteDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
