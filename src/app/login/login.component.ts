import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthService } from '../auth.service';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {

  loading = false;
  submitted = false;

  user:{username:string, password:string};
  returnUrl: string;

  constructor(
      private route: ActivatedRoute,
      private router: Router,
      private auth: AuthService,
  ) {
      // redirect to home if already logged in
      if (this.auth.isLogged()) {
          this.router.navigate(['/']);
      }
  }


  ngOnInit() {
    this.user = {username:'', password:''};
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  onSubmit() {
      this.submitted = true;

      this.loading = true;
      this.auth.login(this.user.username, this.user.password);
          // .pipe(first())
          // .subscribe(
          //     data => {
          //         this.router.navigate([this.returnUrl]);
          //     },
          //     error => {
          //         this.loading = false;
          //     });
  }

}
