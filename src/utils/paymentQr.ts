import QRCode from 'qrcode';
import type { StorePayoutAccount } from '../types/store';

export function buildUpiQrUri(params: {
  vpa: string;
  payeeName?: string;
  amount?: number;
  note?: string;
  currency?: string;
}): string {
  const vpa = params.vpa.trim();
  if (!vpa) return '';
  const pn = (params.payeeName || 'Streamlify Store').trim();
  const tn = (params.note || 'Store Order Payment').trim();
  const base = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(pn)}&tn=${encodeURIComponent(tn)}`;
  if (params.amount && Number(params.amount) > 0) {
    return `${base}&am=${Number(params.amount).toFixed(2)}&cu=INR`;
  }
  return `${base}&cu=INR`;
}

export function buildPayPalLink(params: {
  handleOrEmailOrUrl: string;
  amount?: number;
  currency?: string;
  itemName?: string;
}): string {
  const raw = params.handleOrEmailOrUrl.trim();
  if (!raw) return '';
  const curr = (params.currency || 'USD').toUpperCase();
  const amt = params.amount && Number(params.amount) > 0 ? Number(params.amount).toFixed(2) : '';

  if (/^https?:\/\//i.test(raw)) {
    // If it's a clean paypal.me/<user> URL with no amount path yet, append amount cleanly
    if (/paypal\.me\/[^/?#]+$/i.test(raw) && amt) {
      return `${raw.replace(/\/+$/, '')}/${amt}${curr}`;
    }
    return raw;
  }

  if (raw.includes('@')) {
    const query = new URLSearchParams({
      cmd: '_xclick',
      business: raw,
      item_name: params.itemName || 'Streamlify Store Order',
      currency_code: curr,
    });
    if (amt) query.set('amount', amt);
    return `https://www.paypal.com/cgi-bin/webscr?${query.toString()}`;
  }

  const cleanHandle = raw.replace(/^@+/, '').replace(/^paypal\.me\//i, '').replace(/\/+$/, '');
  return `https://paypal.me/${cleanHandle}${amt ? `/${amt}${curr}` : ''}`;
}

export function resolveAccountQrPayload(
  account: Pick<StorePayoutAccount, 'account_type' | 'account_holder_name' | 'upi_id' | 'paypal_handle' | 'payment_link' | 'qr_payload' | 'label'>,
  opts?: {
    amount?: number;
    inrAmount?: number;
    currency?: string;
    note?: string;
  }
): string {
  const explicitPayload = account.qr_payload?.trim();
  const explicitLink = account.payment_link?.trim();

  if (account.account_type === 'upi') {
    if (account.upi_id?.trim()) {
      return buildUpiQrUri({
        vpa: account.upi_id,
        payeeName: account.account_holder_name || account.label,
        amount: opts?.currency === 'INR' ? opts?.amount : opts?.inrAmount,
        note: opts?.note,
      });
    }
    return explicitPayload || explicitLink || '';
  }

  if (account.account_type === 'paypal') {
    const target = explicitLink || account.paypal_handle?.trim() || explicitPayload || '';
    if (!target) return '';
    return buildPayPalLink({
      handleOrEmailOrUrl: target,
      amount: opts?.amount,
      currency: opts?.currency || 'USD',
      itemName: opts?.note || account.label,
    });
  }

  if (account.account_type === 'bank_transfer' && account.upi_id?.trim()) {
    return buildUpiQrUri({
      vpa: account.upi_id,
      payeeName: account.account_holder_name || account.label,
      amount: opts?.currency === 'INR' ? opts?.amount : opts?.inrAmount,
      note: opts?.note,
    });
  }

  return explicitPayload || explicitLink || '';
}

export async function generateQrDataUrl(payload: string): Promise<string> {
  const clean = String(payload || '').trim();
  if (!clean) {
    throw new Error('Enter a payment link, UPI VPA, PayPal handle, or QR payload first.');
  }
  return QRCode.toDataURL(clean, {
    width: 280,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}

export function resizeQrImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid or unsupported QR image file.'));
      img.onload = () => {
        const maxDim = 320;
        const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
        const targetW = Math.max(64, Math.round((img.width || maxDim) * scale));
        const targetH = Math.max(64, Math.round((img.height || maxDim) * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable for QR processing.'));
          return;
        }
        // Always paint solid white backing so transparent QR PNGs stay scannable everywhere
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        let dataUrl = canvas.toDataURL('image/png');
        if (dataUrl.length > 100000) {
          dataUrl = canvas.toDataURL('image/webp', 0.9);
        }
        if (dataUrl.length > 100000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        }
        if (dataUrl.length > 118000) {
          reject(new Error('QR image is too large even after compression. Please upload a smaller PNG or JPG.'));
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
