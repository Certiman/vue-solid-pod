import { defineStore } from 'pinia/dist/pinia'

/** Servs the Solid POD session object
 * 
 * {
    "sessionId": "fb2c17ae-ef1e-4ec0-8c9e-94466f5301c9",
    "isLoggedIn": true,
    "webId": "https://id.inrupt.com/certiman",
    "clientAppId": "0e2490f5-b450-47bc-a7dc-b26559987b2f",
    "expirationDate": 1723742266764
 * }
 * 
 */

export const useSession = defineStore('solidPodSession', {
  state: () => ({})
})
