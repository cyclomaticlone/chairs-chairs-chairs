export function imageKeyToFileName(key) {
  return key.replace('chairs-chairs-chairs-', '');
}

export function disableButton(button) {
  button.setAttribute('disabled', '');
  button.classList.add('--disabled');
}

export function enableButton(button) {
  button.removeAttribute('disabled');
  button.classList.remove('--disabled');
}
