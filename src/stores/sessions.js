import { reactive } from 'vue'
import { processStore } from './process'

export const sessionStore = reactive({
  canGetPodURLs: false,
  allPodUrls: [], // the WebId's OWN pod Urls
  loggedInWebId: '',
  selectedPodUrl: '',
  authProvidersSessionData: {},
  locale: 'en-us', // TODO: link this with i18
  canDisplayData() {
    return this.selectedPodUrl.length > 0
  },
  ownStoragePodRoot() {
    // From https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/
    // returns https://storage.inrupt.com, in order to recreate the RDFSource URIs
    const sp = this.selectedPodUrl
    if (!sp) return null
    const tld = sp.substring(0, sp.length - 1).lastIndexOf('/')
    return sp.substring(0, tld)
  },
  fullAppProcessURL(processURI, task) {
    // called as Pod ProcessURI, must return to an application path (inverse of above)
    // generates /process/processName/taskName
    if (!processURI) return null
    const processName = processStore.shorthandForProcessURI(processURI)
    const fullAppProcessURL = `/process/${processName}${task}`
    // console.log(`sessionStore.fullAppProcessURL generated: ${fullAppProcessURL}.`)
    return fullAppProcessURL
  },
  fullAppTaskURL(taskURI, action, step) {
    // given a full task URI, must return application path to that task, given a stp
    if (!taskURI) return null
    const taskName = processStore.extractProcTaskAppPath(taskURI, step)
    return `/process/${taskName}`
  },
  addSolidPodAuthData({ token, state }) {
    // From Inrupt at least, to be checked for the others
    this.authProvidersSessionData.inrupt = { token: token, state: state }
  }
})
