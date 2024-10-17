import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

export function showInfoToast(text) {
  toast.success(text, {
    style: {
      padding: '16px',
      color: '#ffffff',
      background: '#196180',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#196180',
    },
    icon: <FontAwesomeIcon icon={faExclamationCircle} />
  });
}

export function showSuccessToast(text) {
  toast.success(text, {
    style: {
      padding: '16px',
      color: '#ffffff',
      background: '#007137',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#007137',
    },
  });
}

export function showErrorToast(text) {
  toast.error(text, {
    style: {
      padding: '16px',
      color: '#ffffff',
      background: '#a2163f',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#a2163f',
    },
  });
}
