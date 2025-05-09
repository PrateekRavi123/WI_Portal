import { Component } from '@angular/core';
import { DashboardCardComponent } from "../../components/dashboard-card/dashboard-card.component";
import { Chart, registerables } from 'chart.js';
import { DashboardService } from '../../services/dashboard/dashboard.service';
export interface checklistCircleData{
  circle: string;
  checklist_count: number;
}
export interface checklistDivData{
  div: string;
  divname: string;
  checklist_count: number;
  location_count: number;
}
@Component({
  selector: 'app-dashboard-content',
  imports: [DashboardCardComponent],
  templateUrl: './dashboard-content.component.html',
  styleUrl: './dashboard-content.component.css'
})
export class DashboardContentComponent {
  selectedMonth: string = '';
  checklistcount: string|null='';
  completetcount: string|null='';
  pendingcount: string|null='';
  checklistCircleData : checklistCircleData[] = [];
  checklistDivData : checklistDivData[] = [];
  graphChart: any;
  pieChart: any;
  constructor(private dashboardservice: DashboardService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    
    this.setCurrentMonth(); // Set default value to current month
    this.fetchDashboardData(this.selectedMonth); // Load initial data

  }
  setCurrentMonth() {
    const today = new Date();
    this.selectedMonth = today.toISOString().slice(0, 7); // Format YYYY-MM
  }
  onMonthChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement && inputElement.value) {
      this.selectedMonth = inputElement.value;
      this.fetchDashboardData(this.selectedMonth);
    }
  }
  fetchDashboardData(month: string) {
    this.getCount(month);
    this.getchecklistcirclecount(month);
    this.getchecklistdivcount(month);
  }
  getCount(month: string){
    this.dashboardservice.getAllCount(month).subscribe({
      next: (data) => {
        this.checklistcount = data[0].checklist_Count;
        this.completetcount = data[0].completed_Count;
        this.pendingcount = data[0].pending_Count;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }

  getchecklistcirclecount(month: string){
    this.dashboardservice.getchecklistcirclecount(month).subscribe({
      next: (data) => {
        this.checklistCircleData = data;
        this.createPieChart();
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }

  getchecklistdivcount(month: string){
    this.dashboardservice.getchecklistdivcount(month).subscribe({
      next: (data) => {
        this.checklistDivData = data;
        this.createGraphChart();
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }
  createGraphChart(): void {
    const ctx = document.getElementById('graphChart') as HTMLCanvasElement;
    if (this.graphChart) {
      this.graphChart.destroy();
    }
    this.graphChart  = new Chart(ctx, {
      type: 'bar', // or 'bar' for a bar chart
      data: {
        labels: this.checklistDivData.map(item => item.divname),
        datasets: [{
          label: 'Number of Locations',
          data: this.checklistDivData.map(item => item.location_count),
          borderColor: 'rgb(0, 0, 0)',
          borderWidth: 5,
          
        },
        {
          label: 'Number of checklist',
          data: this.checklistDivData.map(item => item.checklist_count),
          borderColor: 'rgb(255, 255, 255)',
          borderWidth: 5,
          
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#333',font: {
                weight: 'bold', // Make x-axis labels bold
                size: 12 // Optional: Adjust font size
              } // Dark text for legend
            }
          },
          tooltip: {
            titleFont: {
              weight: 'bold' // Make tooltip title bold
            },
            bodyFont: {
              weight: 'bold' // Make tooltip body text bold
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#333',
              font: {
                weight: 'bold', // Make x-axis labels bold
                size: 12 // Optional: Adjust font size
              }
            }
          },
          y: {
            ticks: {
              color: '#333',
              font: {
                weight: 'bold', // Make x-axis labels bold
                size: 12 // Optional: Adjust font size
              }
            }
          }
        }
      }
    });
  }

  createPieChart(): void {
    const ctx = document.getElementById('pieChart') as HTMLCanvasElement;
    if(this.pieChart){
      this.pieChart.destroy();
    }
     this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: this.checklistCircleData.map(item => item.circle),
        datasets: [{
          label: 'Number of checklist',
          data: this.checklistCircleData.map(item => item.checklist_count),
          backgroundColor: [
            'rgba(245, 6, 58, 0.8)',
            'rgba(2, 75, 124, 0.8)',
            'rgba(250, 181, 7, 0.8)'
          ],
          borderColor: [
            'rgba(245, 6, 58, 0.8)',
            'rgba(2, 75, 124, 0.8)',
            'rgba(250, 181, 7, 0.8)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            titleFont: {
              weight: 'bold' // Make tooltip title bold
            },
            bodyFont: {
              weight: 'bold' // Make tooltip body text bold
            }
          }
        }
      }
    });
  }
}
