import { reactive } from 'vue'

export const modalStore = reactive({
  canShowViewModal: false,
  canShowAddStorage: true,
  mode: 'light',
  switch() {
    this.mode = this.mode == 'dark' ? 'light' : 'dark'
  },
  showToastWithMessage: false,
  ToastMessage: '' // FIXME: should be an array, as many messages might get sent
})
