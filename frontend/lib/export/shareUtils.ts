/**
 * ShareUtils - Cross-platform Sharing Utilities
 *
 * Features:
 * - Native Web Share API with intelligent fallbacks
 * - Clipboard API with legacy support
 * - Social media sharing (WhatsApp, Twitter, Facebook, Email)
 * - Print functionality with optimized layouts
 * - Share tracking and analytics
 *
 * @author BhriguWelt Team
 * @version 2.0.0
 */

import { BirthData, ChartData, Interpretation } from './pdfGenerator';

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

export interface ShareResult {
  success: boolean;
  method: 'native' | 'clipboard' | 'download' | 'social' | 'print' | 'email';
  error?: string;
}

export class ShareUtils {
  /**
   * Check if native Web Share API is supported
   */
  static isNativeShareSupported(): boolean {
    return typeof navigator !== 'undefined' &&
           'share' in navigator &&
           typeof navigator.share === 'function';
  }

  /**
   * Check if Clipboard API is supported
   */
  static isClipboardSupported(): boolean {
    return typeof navigator !== 'undefined' &&
           'clipboard' in navigator &&
           typeof navigator.clipboard?.writeText === 'function';
  }

  /**
   * Check if file sharing is supported
   */
  static isFileShareSupported(): boolean {
    return this.isNativeShareSupported() &&
           navigator.canShare !== undefined;
  }

  /**
   * Share prediction with intelligent fallback strategy
   * Priority: Native Share API > Clipboard > Download
   */
  static async sharePrediction(
    predictionData: {
      title: string;
      content: string;
      birthData?: BirthData;
      category?: string;
      url?: string;
    },
    options: {
      preferredMethod?: 'native' | 'clipboard' | 'social';
      includeLink?: boolean;
      onSuccess?: (method: string) => void;
      onError?: (error: string) => void;
    } = {}
  ): Promise<ShareResult> {
    try {
      const { title, content, url, category } = predictionData;
      const shareTitle = `${title} - BhriguWelt`;
      const shareText = this.formatShareText(content, 280); // Limit for social media

      // Include URL if available and requested
      const shareUrl = options.includeLink && url ? url : window.location.href;

      // Strategy 1: Native Share API (mobile/modern browsers)
      if (!options.preferredMethod || options.preferredMethod === 'native') {
        if (this.isNativeShareSupported()) {
          try {
            await navigator.share({
              title: shareTitle,
              text: shareText,
              url: shareUrl,
            });

            if (options.onSuccess) options.onSuccess('native');
            return { success: true, method: 'native' };
          } catch (error) {
            // User cancelled or error - try fallback
            if (error instanceof Error && error.name === 'AbortError') {
              return { success: false, method: 'native', error: 'User cancelled sharing' };
            }
            // Continue to fallback methods
            console.warn('Native share failed, trying fallback:', error);
          }
        }
      }

      // Strategy 2: Clipboard API
      if (!options.preferredMethod || options.preferredMethod === 'clipboard') {
        if (this.isClipboardSupported()) {
          try {
            const clipboardText = `${shareTitle}\n\n${content}\n\n${shareUrl}`;
            await navigator.clipboard.writeText(clipboardText);

            if (options.onSuccess) options.onSuccess('clipboard');
            return { success: true, method: 'clipboard' };
          } catch (error) {
            console.warn('Clipboard copy failed:', error);
            // Continue to legacy fallback
          }
        }
      }

      // Strategy 3: Legacy clipboard (textarea method)
      try {
        const textToCopy = `${shareTitle}\n\n${content}\n\n${shareUrl}`;
        await this.legacyClipboardCopy(textToCopy);

        if (options.onSuccess) options.onSuccess('clipboard');
        return { success: true, method: 'clipboard' };
      } catch (error) {
        console.error('All sharing methods failed:', error);
        if (options.onError) options.onError('Sharing not supported on this device');
        return {
          success: false,
          method: 'clipboard',
          error: 'Sharing not supported on this device',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (options.onError) options.onError(errorMessage);
      return { success: false, method: 'native', error: errorMessage };
    }
  }

  /**
   * Share PDF file using native share or download
   */
  static async sharePDF(
    pdfBlob: Blob,
    fileName: string,
    options: {
      title?: string;
      text?: string;
      onSuccess?: (method: string) => void;
      onError?: (error: string) => void;
    } = {}
  ): Promise<ShareResult> {
    try {
      // Check if file sharing is supported
      if (this.isFileShareSupported()) {
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

        // Verify we can share this file
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: options.title || 'Birth Chart Report',
              text: options.text || 'Your Vedic astrology birth chart analysis',
              files: [file],
            });

            if (options.onSuccess) options.onSuccess('native');
            return { success: true, method: 'native' };
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              return { success: false, method: 'native', error: 'User cancelled sharing' };
            }
            console.warn('File share failed, downloading instead:', error);
          }
        }
      }

      // Fallback: Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (options.onSuccess) options.onSuccess('download');
      return { success: true, method: 'download' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (options.onError) options.onError(errorMessage);
      return { success: false, method: 'download', error: errorMessage };
    }
  }

  /**
   * Share via WhatsApp
   */
  static shareViaWhatsApp(text: string, url?: string): ShareResult {
    try {
      const message = encodeURIComponent(`${text}\n\n${url || window.location.href}`);
      const whatsappUrl = `https://wa.me/?text=${message}`;
      window.open(whatsappUrl, '_blank');
      return { success: true, method: 'social' };
    } catch (error) {
      return {
        success: false,
        method: 'social',
        error: error instanceof Error ? error.message : 'Failed to share via WhatsApp',
      };
    }
  }

  /**
   * Share via Twitter/X
   */
  static shareViaTwitter(text: string, url?: string): ShareResult {
    try {
      const tweetText = encodeURIComponent(this.formatShareText(text, 250));
      const tweetUrl = url ? encodeURIComponent(url) : encodeURIComponent(window.location.href);
      const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`;
      window.open(twitterUrl, '_blank', 'width=550,height=420');
      return { success: true, method: 'social' };
    } catch (error) {
      return {
        success: false,
        method: 'social',
        error: error instanceof Error ? error.message : 'Failed to share via Twitter',
      };
    }
  }

  /**
   * Share via Facebook
   */
  static shareViaFacebook(url?: string): ShareResult {
    try {
      const shareUrl = url ? encodeURIComponent(url) : encodeURIComponent(window.location.href);
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
      window.open(facebookUrl, '_blank', 'width=550,height=420');
      return { success: true, method: 'social' };
    } catch (error) {
      return {
        success: false,
        method: 'social',
        error: error instanceof Error ? error.message : 'Failed to share via Facebook',
      };
    }
  }

  /**
   * Share via Email
   */
  static shareViaEmail(
    subject: string,
    body: string,
    options: {
      to?: string;
      cc?: string;
      bcc?: string;
    } = {}
  ): ShareResult {
    try {
      const params = new URLSearchParams({
        subject,
        body,
        ...(options.to && { to: options.to }),
        ...(options.cc && { cc: options.cc }),
        ...(options.bcc && { bcc: options.bcc }),
      });
      const mailtoUrl = `mailto:?${params.toString()}`;
      window.location.href = mailtoUrl;
      return { success: true, method: 'email' };
    } catch (error) {
      return {
        success: false,
        method: 'email',
        error: error instanceof Error ? error.message : 'Failed to share via Email',
      };
    }
  }

  /**
   * Share via Telegram
   */
  static shareViaTelegram(text: string, url?: string): ShareResult {
    try {
      const message = encodeURIComponent(`${text}\n\n${url || window.location.href}`);
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url || window.location.href)}&text=${encodeURIComponent(text)}`;
      window.open(telegramUrl, '_blank');
      return { success: true, method: 'social' };
    } catch (error) {
      return {
        success: false,
        method: 'social',
        error: error instanceof Error ? error.message : 'Failed to share via Telegram',
      };
    }
  }

  /**
   * Print prediction with optimized layout
   */
  static async printPrediction(
    predictionData: {
      title: string;
      content: string;
      birthData?: BirthData;
      chartData?: ChartData;
      interpretations?: Interpretation[];
    },
    options: {
      onBeforePrint?: () => void;
      onAfterPrint?: () => void;
      onError?: (error: string) => void;
    } = {}
  ): Promise<ShareResult> {
    try {
      // Create print-optimized content
      const printContent = this.createPrintableContent(predictionData);

      // Create iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Failed to create print iframe');
      }

      // Write content to iframe
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();

      // Wait for content to load
      await new Promise(resolve => {
        if (iframe.contentWindow) {
          iframe.contentWindow.onload = resolve;
        } else {
          setTimeout(resolve, 100);
        }
      });

      // Trigger print
      if (options.onBeforePrint) options.onBeforePrint();

      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // Cleanup after print
      const cleanup = () => {
        if (options.onAfterPrint) options.onAfterPrint();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 100);
      };

      // Listen for print events
      if (iframe.contentWindow) {
        iframe.contentWindow.onafterprint = cleanup;
      }

      // Fallback cleanup after 5 seconds
      setTimeout(cleanup, 5000);

      return { success: true, method: 'print' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Print failed';
      if (options.onError) options.onError(errorMessage);
      return { success: false, method: 'print', error: errorMessage };
    }
  }

  /**
   * Legacy clipboard copy using textarea method
   */
  private static async legacyClipboardCopy(text: string): Promise<void> {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const successful = document.execCommand('copy');
      if (!successful) {
        throw new Error('Copy command failed');
      }
    } finally {
      document.body.removeChild(textarea);
    }
  }

  /**
   * Format text for sharing (truncate if needed)
   */
  private static formatShareText(text: string, maxLength: number = 280): string {
    if (text.length <= maxLength) {
      return text;
    }

    // Truncate and add ellipsis
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Create printable HTML content
   */
  private static createPrintableContent(predictionData: {
    title: string;
    content: string;
    birthData?: BirthData;
    chartData?: ChartData;
    interpretations?: Interpretation[];
  }): string {
    const { title, content, birthData, chartData, interpretations } = predictionData;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - BhriguWelt</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 2cm;
            }
            body {
              font-family: 'Georgia', 'Times New Roman', serif;
              font-size: 11pt;
              line-height: 1.6;
              color: #000;
            }
            h1 {
              color: #4A148C;
              font-size: 24pt;
              margin-bottom: 0.5cm;
              page-break-after: avoid;
            }
            h2 {
              color: #7B1FA2;
              font-size: 16pt;
              margin-top: 1cm;
              margin-bottom: 0.3cm;
              page-break-after: avoid;
            }
            h3 {
              color: #9C27B0;
              font-size: 13pt;
              margin-top: 0.5cm;
              margin-bottom: 0.2cm;
              page-break-after: avoid;
            }
            p {
              margin-bottom: 0.3cm;
              page-break-inside: avoid;
            }
            .header {
              text-align: center;
              border-bottom: 2pt solid #4A148C;
              padding-bottom: 0.5cm;
              margin-bottom: 1cm;
            }
            .birth-data {
              background-color: #f5f5f5;
              padding: 0.5cm;
              margin-bottom: 1cm;
              border-left: 4pt solid #7B1FA2;
            }
            .birth-data p {
              margin: 0.1cm 0;
            }
            .interpretation {
              margin-bottom: 1cm;
              page-break-inside: avoid;
            }
            .citation {
              font-size: 9pt;
              font-style: italic;
              color: #666;
              margin-top: 0.2cm;
              padding-left: 0.5cm;
              border-left: 2pt solid #ddd;
            }
            .footer {
              margin-top: 2cm;
              padding-top: 0.5cm;
              border-top: 1pt solid #ccc;
              font-size: 9pt;
              text-align: center;
              color: #666;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          ${birthData ? `
            <div class="birth-data">
              <p><strong>Name:</strong> ${birthData.name}</p>
              <p><strong>Date of Birth:</strong> ${birthData.dateOfBirth}</p>
              <p><strong>Time of Birth:</strong> ${birthData.timeOfBirth}</p>
              <p><strong>Place of Birth:</strong> ${birthData.placeOfBirth}</p>
            </div>
          ` : ''}
        </div>

        <div class="content">
          ${content.split('\n\n').map(para => `<p>${para}</p>`).join('')}
        </div>

        ${interpretations && interpretations.length > 0 ? `
          <h2>Detailed Interpretations</h2>
          ${interpretations.map(interp => `
            <div class="interpretation">
              <h3>${interp.category}: ${interp.title}</h3>
              <p>${interp.content}</p>
              ${interp.citations && interp.citations.length > 0 ? `
                <div class="citation">
                  <strong>Citations:</strong><br>
                  ${interp.citations.map(c => `• ${c}`).join('<br>')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        ` : ''}

        <div class="footer">
          <p>Generated by BhriguWelt on ${new Date().toLocaleDateString()}</p>
          <p>For personal use only • © BhriguWelt</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate shareable link with prediction data (requires backend support)
   */
  static async generateShareLink(
    predictionData: {
      title: string;
      content: string;
      birthData?: BirthData;
      category?: string;
    },
    options: {
      expirationDays?: number;
      password?: string;
      onSuccess?: (url: string) => void;
      onError?: (error: string) => void;
    } = {}
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // This would require backend API endpoint implementation
      // For now, return the current URL
      const shareUrl = window.location.href;

      if (options.onSuccess) options.onSuccess(shareUrl);
      return { success: true, url: shareUrl };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate share link';
      if (options.onError) options.onError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Copy text to clipboard
   */
  static async copyToClipboard(text: string): Promise<ShareResult> {
    try {
      if (this.isClipboardSupported()) {
        await navigator.clipboard.writeText(text);
      } else {
        await this.legacyClipboardCopy(text);
      }
      return { success: true, method: 'clipboard' };
    } catch (error) {
      return {
        success: false,
        method: 'clipboard',
        error: error instanceof Error ? error.message : 'Failed to copy to clipboard',
      };
    }
  }
}

/**
 * Show success toast notification
 */
export function showShareSuccess(method: string): void {
  const messages: Record<string, string> = {
    native: 'Shared successfully!',
    clipboard: 'Copied to clipboard!',
    download: 'Downloaded successfully!',
    social: 'Opening sharing page...',
    print: 'Printing...',
    email: 'Opening email client...',
  };

  const message = messages[method] || 'Shared successfully!';

  // Use toast notification if available, otherwise use alert
  if (typeof window !== 'undefined' && 'toast' in window) {
    // Assumes you have a toast notification system
    (window as any).toast.success(message);
  } else {
    // Fallback: Create simple notification
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #4CAF50;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }
}

/**
 * Show error toast notification
 */
export function showShareError(error: string): void {
  if (typeof window !== 'undefined' && 'toast' in window) {
    (window as any).toast.error(error);
  } else {
    // Fallback: Create simple error notification
    const notification = document.createElement('div');
    notification.textContent = error;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #f44336;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 5000);
  }
}
