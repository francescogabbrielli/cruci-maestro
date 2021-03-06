import { browser, by, element } from 'protractor';

export class AppPage {
  navigateTo(): Promise<unknown> {
    return browser.get(browser.baseUrl) as Promise<unknown>;
  }

  getSchemaClass(): Promise<string> {
    return element(by.css('schema table')).getAttribute('class') as Promise<string>;
  }
}
