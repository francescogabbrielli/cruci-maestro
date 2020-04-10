import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {

  title:string = "CruciMaestro";

  cellSize:number = 28;

}
