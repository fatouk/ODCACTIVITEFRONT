import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeAffichageComponent } from './liste-affichage.component';

describe('ListeAffichageComponent', () => {
  let component: ListeAffichageComponent;
  let fixture: ComponentFixture<ListeAffichageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeAffichageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListeAffichageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
