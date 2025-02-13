((ready) => {
  if (document.readyState !== 'loading') {
    return ready()
  }
  document.addEventListener('DOMContentLoaded', () => ready())
})(() => {
  console.log('Page loaded and ready')
})