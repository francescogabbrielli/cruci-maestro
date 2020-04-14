import { Injectable } from '@angular/core';

import {
    Stitch, StitchAppClient,
    RemoteMongoClient,
    AnonymousCredential,
    UserPasswordCredential,
    GoogleRedirectCredential
} from 'mongodb-stitch-browser-sdk';

@Injectable({
  providedIn: 'root',
})
export class BackendService {

  private client:StitchAppClient = Stitch.initializeDefaultAppClient('crucimaestro-vbgbj');
  private db;

  constructor() {
    this.db = this.client.getServiceClient(RemoteMongoClient.factory, 'CruciMaestro-Service').db('cruci-maestro');
  }

}
