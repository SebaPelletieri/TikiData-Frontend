import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  standalone: true,
  selector: 'app-navbar',
  styleUrls: ['./navbar.css'],
  templateUrl: './navbar.html',
})
export class Navbar {}
