import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeDebutComponent } from './liste-debut.component';

describe('ListeDebutComponent', () => {
  let component: ListeDebutComponent;
  let fixture: ComponentFixture<ListeDebutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeDebutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListeDebutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
