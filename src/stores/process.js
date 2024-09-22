import { reactive } from 'vue'

/**
 * A processProvider must be stored as:
 * {
 *  ContainerURI: String, // Where /process can be found
 *  Label: String,
 *  ProviderWebId: String // If possible, instead of the ContainerURI.
 *  Active: boolean // If contact is possible with this provider.
 * }
 */

export const processStore = reactive({
  processProviders: [], // Comunica can query several process sources
  canShowAddProcessProviderModal: false,
  canProcessData() {
    return this.processProviders.length > 0
  },
  extractProcessResource(processURI) {
    // https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/
    // Returns TheThirdProcess/
    let p = processURI
    return p.substring(p.substring(0, p.length - 1).lastIndexOf('/') + 1)
  },
  extractTaskResource(taskURI) {
    // https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/SecondTask
    // returns SecondTask
    let p = taskURI
    return p.substring(p.lastIndexOf('/') + 1)
  },
  extractProcTaskResource(taskURI, step) {
    // https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/SecondTask
    // returns TheThirdProcess/SecondTask#
    let p = taskURI
    const identifier = '/process/'
    return p.substring(p.indexOf(identifier) + identifier.length) + `/${step}`
  }
})
