import Swal from 'sweetalert2';

/**
 * Intercepts default window.alert calls and redirects them to a
 * styled SweetAlert2 modal popup matching the app's visual theme.
 */
export const initGlobalAlertOverride = () => {
  window.alert = (message) => {
    const lowercaseMsg = String(message || '').toLowerCase();
    let icon = 'info';
    let title = 'Notification';

    if (
      lowercaseMsg.includes('success') ||
      lowercaseMsg.includes('successfully') ||
      lowercaseMsg.includes('saved')
    ) {
      icon = 'success';
      title = 'Success';
    } else if (
      lowercaseMsg.includes('failed') ||
      lowercaseMsg.includes('error') ||
      lowercaseMsg.includes('invalid')
    ) {
      icon = 'error';
      title = 'Error';
    } else if (
      lowercaseMsg.includes('please') ||
      lowercaseMsg.includes('missing') ||
      lowercaseMsg.includes('select') ||
      lowercaseMsg.includes('fill') ||
      lowercaseMsg.includes('required') ||
      lowercaseMsg.includes('warn') ||
      lowercaseMsg.includes('warning') ||
      lowercaseMsg.includes('must')
    ) {
      icon = 'warning';
      title = 'Warning';
    }

    Swal.fire({
      title: title,
      text: message,
      icon: icon,
      confirmButtonColor: '#5c60f5',
      confirmButtonText: 'OK',
    });
  };
};
