import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  imports: [RouterLink, RouterLinkActive],
  standalone: true,
  selector: 'app-navbar',
  styleUrls: ['./navbar.css'],
  templateUrl: './navbar.html',
})
export class Navbar {}
