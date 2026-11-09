import { Component } from '@angular/core';
import { AdminDashboard } from '../../components/admin-dashboard/admin-dashboard';

@Component({
  imports: [AdminDashboard],
  selector: 'app-admin',
  styleUrl: './admin.css',
  templateUrl: './admin.html',
})
export class Admin {}
