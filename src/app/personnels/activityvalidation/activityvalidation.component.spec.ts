import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityvalidationComponent } from './activityvalidation.component';

describe('ActivityvalidationComponent', () => {
  let component: ActivityvalidationComponent;
  let fixture: ComponentFixture<ActivityvalidationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityvalidationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityvalidationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
