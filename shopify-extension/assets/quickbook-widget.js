(() => {
  const mountId = window.QUICKBOOK_MOUNT_ID || 'quickbook-widget';
  const mount = document.getElementById(mountId);
  if (mount && !mount.dataset.quickbookLoaded) {
    mount.dataset.quickbookLoaded = 'true';
    mount.innerHTML = '<p style="font-family:Inter,system-ui,sans-serif">Upload frontend/dist/quickbook-widget.iife.js to this asset as quickbook-widget.iife.js.</p>';
  }
})();
