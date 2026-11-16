import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  // Sin RouterLink importado, los <a routerLink> quedaban sin href y no se podía hacer clic
  imports: [RouterLink, RouterLinkActive, TranslocoPipe],
  selector: 'app-footer',
  styleUrl: './footer.css',
  templateUrl: './footer.html',
})
export class Footer {}
