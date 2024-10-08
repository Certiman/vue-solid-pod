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
  processTaskInEdit: '',
  currentTaskURI: '', // pod URI of the process/task which is being selected for execution 
  canProcessData() {
    return this.processProviders.length > 0
  },
  shorthandForProcessURI(processURI) {
    // https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/
    // Returns TheThirdProcess/
    if (!processURI) return null
    let p = processURI
    
    const shortHURI = p.substring(p.substring(0, p.length - 1).lastIndexOf('/') + 1)
    // console.log(`shortHURI() generated: ${shortHURI}.`)
    console.log(`shorthandForProcessURI(${processURI}): ${shortHURI}`)
    return shortHURI
  },
  shorthandForTaskURI(taskURI) {
    // Given: https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/SecondTask
    // returns SecondTask and NEVER SecondTask#0 if a step is present.
    if (!taskURI) return null
    let p = taskURI
    const shorthandForTaskURI = p.substring(p.lastIndexOf('/') + 1)
    console.log(`shorthandForTaskURI(${taskURI}): ${shorthandForTaskURI}`)
    return shorthandForTaskURI
  },
  extractProcTaskAppPath(taskURI, step) {
    // Given: https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/SecondTask
    // returns TheThirdProcess/SecondTask/{step}
    // and NOT TheThirdProcess/SecondTask#{step}
    if (!taskURI) return null
    let p = taskURI
    const identifier = '/process/'
    const shURI= p.substring(p.indexOf(identifier) + identifier.length) + `/${step}`
    console.log(`extractProcTaskAppPath(${taskURI}): ${shURI}`)
    return shURI
  },
  extractProcTaskResource(taskURI, step) {
    // Given: https://storage.inrupt.com/b5186a91-fffe-422a-bf6a-02a61f470541/process/TheThirdProcess/SecondTask
    // returns TheThirdProcess/SecondTask#{step}
    let p = taskURI
    const identifier = '/process/'
    return p.substring(p.indexOf(identifier) + identifier.length) + (step ? `#${step}` : '')
  }
})
