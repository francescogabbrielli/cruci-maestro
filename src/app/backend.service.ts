import { Injectable } from '@angular/core';
import { EJSON, ObjectId } from 'bson';

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

  private client:StitchAppClient;
  private db;

  constructor() {
    this.client = Stitch.initializeDefaultAppClient('crucimaestro-vbgbj');
    this.db = this.client.getServiceClient(RemoteMongoClient.factory, 'CruciMaestro-Service').db('cruci-maestro');
  }

  login(user:string, password:string):Promise<any> {
    let loginUser = this.client.auth.loginWithCredential(new UserPasswordCredential(user, password));
    return loginUser.then(
        data => {
          return {
            id: data.id,
            username: user,
            password: password,
            firstName: "Pippo",
            lastName: "Poppi",
            token: "what?",
            config: EJSON.deserialize(data.customData.config)
          };
        },
        err => {
          console.log(err);
          throw err.message;
        }
      );
  }

  updateUserConfig(user) {
    this.db.collection('configs').updateOne({user_id: user.id}, {$set: {config: user.config}}, {upsert:true})
    .then(
      res => console.log(res),
      err => console.log(err)
    );
  }

  loadSchema() {
    return this.db.collection('schemas').findOne();
  }

  saveSchema(id: string, cells:string, defs:string[]) {
    return this.db.collection('schemas').updateOne(
      {_id: new ObjectId(id)}, {$set: {cells: cells, definitions: defs}}
    );
  }

}
