import { NOMOR_MAMI } from '../data/constants';

export function bukaWA(pesan: string, onFallbackMessage?: (msg: string) => void): void {
  const enc = encodeURIComponent(pesan);
  const waWebUrl = `https://api.whatsapp.com/send?phone=${NOMOR_MAMI}&text=${enc}`;
  
  // Try intent on Android/mobile, with fallback to api.whatsapp.com and clipboard
  if (typeof window !== 'undefined') {
    let blurOccurred = false;
    const onBlur = () => {
      blurOccurred = true;
      window.removeEventListener('blur', onBlur);
    };
    window.addEventListener('blur', onBlur);

    // Try opening whatsapp web or window
    try {
      window.location.href = `intent://send?phone=${NOMOR_MAMI}&text=${enc}#Intent;scheme=whatsapp;package=com.whatsapp;end;`;
    } catch {
      window.open(waWebUrl, '_blank');
    }

    setTimeout(() => {
      window.removeEventListener('blur', onBlur);
      if (!blurOccurred) {
        if (navigator.share) {
          navigator.share({ text: pesan }).catch(() => {
            fallbackClipboard(pesan, onFallbackMessage);
          });
        } else {
          fallbackClipboard(pesan, onFallbackMessage);
        }
      }
    }, 1500);
  }
}

export function fallbackClipboard(pesan: string, notify?: (msg: string) => void): void {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(pesan).then(() => {
      if (notify) notify('📋 Pesan tersalin! Silakan paste di WhatsApp Mami ya 💖');
    }).catch(() => {
      execCopy(pesan, notify);
    });
  } else {
    execCopy(pesan, notify);
  }
}

function execCopy(pesan: string, notify?: (msg: string) => void) {
  try {
    const t = document.createElement('textarea');
    t.value = pesan;
    t.style.position = 'fixed';
    t.style.left = '-9999px';
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    document.body.removeChild(t);
    if (notify) notify('📋 Pesan tersalin! Silakan paste di WhatsApp Mami ya 💖');
  } catch {
    if (notify) notify('⚠️ Tidak dapat menyalin pesan');
  }
}
