// store.js
import { reactive } from 'vue'

export const store = reactive({
  mode: 'light',
  switch() {
    this.mode = this.mode == 'dark' ? 'light' : 'dark'
  }
})
