import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DashboardContentComponent } from './pages/dashboard-content/dashboard-content.component';
import { ChecklistComponent } from './pages/checklist/checklist.component';
import { AddchecklistComponent } from './pages/checklist/addchecklist/addchecklist.component';
import { QuickviewComponent } from './pages/checklist/quickview/quickview.component';
import { InchargesComponent } from './pages/incharges/incharges.component';
import { QuickviewinchargeComponent } from './pages/incharges/quickviewincharge/quickviewincharge.component';
import { AddinchargeComponent } from './pages/incharges/addincharge/addincharge.component';
import { CheckpointComponent } from './pages/checkpoint/checkpoint.component';
import { QuickviewcheckptComponent } from './pages/checkpoint/quickviewcheckpt/quickviewcheckpt.component';
import { AddcheckptComponent } from './pages/checkpoint/addcheckpt/addcheckpt.component';
import { LocationComponent } from './pages/location/location.component';
import { QuickviewlocComponent } from './pages/location/quickviewloc/quickviewloc.component';
import { AddlocComponent } from './pages/location/addloc/addloc.component';
import { EditchecklistComponent } from './pages/checklist/editchecklist/editchecklist.component';
import { authGuard } from './guard/auth.guard';
import { PendingchecklistComponent } from './pages/pendingchecklist/pendingchecklist.component';

export const routes: Routes = [
    { path: "", redirectTo: "/login", pathMatch: 'full' },
    { path: "login", component: LoginComponent },
    {
        path: "",
        component: DashboardComponent,
        //canActivate: [authGuard],
        children: [
            { path: "dashboard", component: DashboardContentComponent },
            { path: "admin", component: DashboardContentComponent },
            { path: "checklist", component: ChecklistComponent,
                children: [
                    { path: '', redirectTo: 'quick-view', pathMatch: 'full' },
                    {path: "quick-view", component: QuickviewComponent},
                    {path: "add", component: AddchecklistComponent},
                    {path: "edit", component: EditchecklistComponent}
                ]
             },
             { path: "incharges", component: InchargesComponent,
                children: [
                    { path: '', redirectTo: 'quick-view', pathMatch: 'full' },
                    {path: "quick-view", component: QuickviewinchargeComponent},
                    {path: "add", component: AddinchargeComponent}
                ]
             },
             { path: "checkpoint", component: CheckpointComponent,
                children: [
                    { path: '', redirectTo: 'quick-view', pathMatch: 'full' },
                    {path: "quick-view", component: QuickviewcheckptComponent},
                    {path: "add", component: AddcheckptComponent}
                ]
             },
             { path: "location", component: LocationComponent,
                children: [
                    { path: '', redirectTo: 'quick-view', pathMatch: 'full' },
                    {path: "quick-view", component: QuickviewlocComponent},
                    {path: "add", component: AddlocComponent}
                ]
             },
             { path: "pendchecklist", component: PendingchecklistComponent},
        ]
    }
];
