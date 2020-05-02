export class Utils {
  static isMobile() {
    return navigator.maxTouchPoints || 'ontouchstart' in document.documentElement
  }
}
