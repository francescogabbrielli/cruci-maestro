/**
 * Stitch Backend Client
 */

import { Injectable } from '@angular/core'
import { EJSON, ObjectId } from 'bson'

import { SchemaModel, SchemaType } from './schema.model'

import {
    Stitch, StitchAppClient,
    RemoteMongoClient,
    AnonymousCredential,
    UserPasswordCredential,
    GoogleRedirectCredential
} from 'mongodb-stitch-browser-sdk'

@Injectable({
  providedIn: 'root',
})
export class BackendService {

  private client:StitchAppClient
  private db

  private initPromise:Promise<any>

  constructor() {
    this.client = Stitch.initializeDefaultAppClient('crucimaestro-vbgbj')
    this.db = this.client.getServiceClient(RemoteMongoClient.factory, 'CruciMaestro-Service').db('cruci-maestro')
  }

  async logout():Promise<any> {
     this.client.auth.logout()
     this.initPromise = this.client.auth.loginWithCredential(new AnonymousCredential())
     return this.initPromise
  }

  async login(user:string, password:string):Promise<any> {
    this.initPromise = this.client.auth.loginWithCredential(new UserPasswordCredential(user, password))
    return this.initPromise.then(
        data => {
          return {
            id: data.id,
            username: user,
            password: password,
            firstName: "Pippo",
            lastName: "Poppi",
            token: "what?",
            config: EJSON.deserialize(data.customData.config)
          }
        },
        err => {
          console.log(err)
          throw err.message
        }
      )
  }

  async updateUserConfig(user) {
    await this.initPromise
    //TODO: ottimizzare restituendo se i campi cambiati comportano un reload
    this.db.collection('configs').updateOne({user_id: user.id}, {$set: {config: user.config}}, {upsert:true})
    .then(
      res => console.log(res),
      err => console.log(err)
    )
  }

  async loadSchema(isAuthor:boolean):Promise<SchemaModel> {
    await this.initPromise
    const options = {
      limit: 1,
      projection: isAuthor ? {} : {cells: 0}
    }
    return this.db.collection('schemas').find({}, options).first().then(doc => {
      let model:SchemaModel = {
        id: doc._id.toString(),
        owner: doc.owner_id.toString(),
        title: doc.title,
        type: doc.type,
        size: [doc.rows, doc.cols],
        definitions: doc.definitions,
        blocks: doc.blocks,
        hints: doc.hints,
      }
      if (doc.cells !== undefined)
        model.cells = JSON.parse(atob(doc.cells))
      return model
    })
  }

  async saveSchema(model:SchemaModel):Promise<any> {
    await this.initPromise
    let id = model.id
    let m = {...model, ...{
      cells: btoa(JSON.stringify(model.cells)),
      rows: model.size[0],
      cols: model.size[1],
    }}
    delete m['blocks']
    if (m.type === SchemaType.Fixed) {
      m.blocks = []
      for (let i=0; i<model.size[0]; i++)
        for (let j=0; j<model.size[1]; j++)
          if (model.cells[i][j]==='.')
            m.blocks.push([i,j,'.'])
    }
    delete m['size']
    delete m['id']
    return this.db.collection('schemas').updateOne(
      {_id: new ObjectId(id)}, {$set: m}
    )
  }

  async check(model:SchemaModel):Promise<any> {
    let m = {
      id: model.id,
      rows: model.size[0],
      cols: model.size[1],
      cells: btoa(JSON.stringify(model.cells))
    }
    return this.client.callFunction("check", [m])
  }

}
