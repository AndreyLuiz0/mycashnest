import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Extrato } from './extrato';

describe('Extrato', () => {
  let component: Extrato;
  let fixture: ComponentFixture<Extrato>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Extrato]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Extrato);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
