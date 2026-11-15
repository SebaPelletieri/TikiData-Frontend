import { Component } from '@angular/core';
import { Home } from '../../components/home/home';

@Component({
  imports: [Home],
  selector: 'app-home-page',
  styleUrl: './home-page.css',
  templateUrl: './home-page.html',
})
export class HomePage {}
