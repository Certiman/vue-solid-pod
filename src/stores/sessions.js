import { reactive } from 'vue'
import { processStore } from './process'

export const sessionStore = reactive({
  canGetPodURLs: false,
  allPodUrls: [], // the WebId's OWN pod Urls
  loggedInWebId: '',
  selectedPodUrl: '',
  authProvidersSessionData: {},
  canDisplayData() {
    return this.selectedPodUrl.length > 0
  },
  fullPodProcessURI(routeParams) {
    // called as path: '/process/:action/:process/:task/:step',
    if (!this.selectedPodUrl) return null
    return `${this.selectedPodUrl}process/${routeParams.process}/${routeParams.task}#${routeParams.step}`
  },
  fullAppProcessURL(processURI, action) {
    // called as Pod ProcessURI, must return to an application path (inverse of above)
    if (!processURI) return null
    const processName = processStore.extractProcessResource(processURI)
    return `/process/${action}/${processName}`
  },
  fullAppTaskURL(taskURI, action, step) {
    // given a full task URI, must return application path to that task, given a stp
    if (!taskURI) return null
    const taskName = processStore.extractProcTaskResource(taskURI, step)
    return `/process/${action}/${taskName}`
  },
  addSolidPodAuthData({ token, state }) {
    // From Inrupt at least, to be checked for the others
    this.authProvidersSessionData.inrupt = { token: token, state: state }
  }
})
