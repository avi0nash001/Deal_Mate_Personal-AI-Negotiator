import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  QrCode,
  Tag,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Product } from '../../types';
import { ensureDealMateProductId } from '../../utils/productIdentifier';

interface ProductQRModalProps {
  product: Product;
  onClose: () => void;
}

export const ProductQRModal: React.FC<ProductQRModalProps> = ({ product, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const printableRef = useRef<HTMLDivElement | null>(null);

  const dealMateId = ensureDealMateProductId(product);

  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);

    // The QR code stores strictly the persistent DealMate Product ID
    QRCode.toDataURL(dealMateId, {
      width: 400,
      margin: 2,
      color: {
        dark: '#090D16',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [dealMateId]);

  const handleCopyId = () => {
    navigator.clipboard?.writeText(dealMateId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${dealMateId}_QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=700');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shelf Tag - ${dealMateId}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              margin: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #fff;
              color: #0f172a;
            }
            .shelf-tag {
              width: 320px;
              border: 2px dashed #0f172a;
              border-radius: 12px;
              padding: 16px;
              text-align: center;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            }
            .brand {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #2563eb;
            }
            .name {
              font-size: 14px;
              font-weight: 800;
              margin: 4px 0 8px 0;
              line-height: 1.3;
            }
            .qr-img {
              width: 180px;
              height: 180px;
              margin: 0 auto 8px auto;
              display: block;
            }
            .id-box {
              font-family: monospace;
              font-size: 13px;
              font-weight: 800;
              background: #f1f5f9;
              padding: 4px 8px;
              border-radius: 6px;
              display: inline-block;
              letter-spacing: 0.5px;
            }
            .price-row {
              display: flex;
              justify-content: space-around;
              align-items: baseline;
              margin-top: 10px;
              padding-top: 8px;
              border-top: 1px solid #e2e880;
            }
            .price {
              font-size: 18px;
              font-weight: 900;
              color: #0f172a;
            }
            .mrp {
              font-size: 12px;
              color: #64748b;
              text-decoration: line-through;
            }
            .stock {
              font-size: 10px;
              color: #16a34a;
              font-weight: 700;
              margin-top: 4px;
            }
            .footer-note {
              font-size: 9px;
              color: #94a3b8;
              margin-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="shelf-tag">
            <div class="brand">${product.brand || 'DealMate Store'}</div>
            <div class="name">${product.name}</div>
            <img src="${qrDataUrl}" class="qr-img" alt="QR Code" />
            <div><span class="id-box">${dealMateId}</span></div>
            <div class="price-row">
              <span class="price">₹${product.listPrice.toLocaleString('en-IN')}</span>
              ${
                product.marketPrice > product.listPrice
                  ? `<span class="mrp">MRP ₹${product.marketPrice.toLocaleString('en-IN')}</span>`
                  : ''
              }
            </div>
            <div class="stock">Store Stock: ${product.stock} units</div>
            <div class="footer-note">Scan with DealMate App for Instant AI Bargain</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-white space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base">Product QR & Shelf Tag</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Persistent DealMate Product Identifier
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Quick Info */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-xl object-cover bg-white dark:bg-slate-900 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
              {product.brand} · {product.category}
            </div>
            <div className="font-display font-bold text-xs truncate">{product.name}</div>
            <div className="text-xs font-mono font-bold mt-0.5 text-slate-700 dark:text-slate-300">
              ₹{product.listPrice.toLocaleString('en-IN')}{' '}
              <span className="text-[11px] font-normal text-slate-500">
                ({product.stock} units in stock)
              </span>
            </div>
          </div>
        </div>

        {/* Persistent DealMate Product ID */}
        <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-indigo-700 dark:text-indigo-300 font-semibold uppercase">
              Unique DealMate Product ID
            </div>
            <div className="font-mono text-sm font-extrabold text-indigo-950 dark:text-indigo-100 tracking-wider">
              {dealMateId}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyId}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-700 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer text-indigo-700 dark:text-indigo-300 transition-colors shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy ID</span>
              </>
            )}
          </button>
        </div>

        {/* QR Code Graphic Display */}
        <div
          ref={printableRef}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-inner flex flex-col items-center justify-center space-y-2"
        >
          {isGenerating ? (
            <div className="w-48 h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
            </div>
          ) : qrDataUrl ? (
            <div className="relative group">
              <img
                src={qrDataUrl}
                alt={`QR code for ${dealMateId}`}
                className="w-48 h-48 object-contain rounded-lg"
              />
              <div className="text-center font-mono text-xs font-bold text-slate-800 tracking-wider">
                {dealMateId}
              </div>
            </div>
          ) : (
            <div className="text-xs text-rose-500 font-mono">Failed to render QR</div>
          )}

          <p className="text-[11px] text-slate-500 text-center font-sans max-w-xs pt-1">
            Points strictly to <strong>{dealMateId}</strong>. When prices or stock change, this QR
            never needs re-printing.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!qrDataUrl || isGenerating}
            className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={!qrDataUrl || isGenerating}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Shelf Tag</span>
          </button>
        </div>
      </div>
    </div>
  );
};
