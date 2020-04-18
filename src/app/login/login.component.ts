import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthService } from '../auth.service';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {

  auth:AuthService;
  router:Router;
  route:ActivatedRoute;

  loading = false;
  submitted = false;

  model:{username:string, password:string};
  error:string;
  returnUrl: string;

  hidden:boolean=true;

  constructor(
      route: ActivatedRoute,
      router: Router,
      auth: AuthService) {
    this.auth = auth;
    this.route = route;
    this.router = router;
    // redirect to home if already logged in
    if (this.auth.isLogged()) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit() {
    this.model = {username:'', password:''};
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit() {
      this.submitted = true;
      this.error = '';
      this.loading = true;
      this.auth.login(this.model.username, this.model.password).then(
        data => this.router.navigate(["/"]),
        err => this.error = err
      ).finally(() => this.loading = false);
  }

}
