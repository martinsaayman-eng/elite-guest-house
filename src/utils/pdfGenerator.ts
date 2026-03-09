import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * This function captures any HTML element by its ID 
 * and turns it into a professional PDF.
 */
export const downloadInvoicePDF = async (invoiceId: string, guestName: string) => {
  const element = document.getElementById('invoice-printable-area');
  if (!element) {
    alert("Could not find the invoice content to print.");
    return;
  }

  try {
    // 1. Take a high-resolution "photo" of the invoice
    const canvas = await html2canvas(element, {
      scale: 2, // Makes the text look sharp, not blurry
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    
    // 2. Create a PDF document (A4 size)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4'
    });

    // 3. Calculate width/height to fit perfectly
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // 4. Add the image to the PDF and save it
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice_${guestName.replace(/\s+/g, '_')}_${invoiceId.slice(0, 5)}.pdf`);
    
  } catch (error) {
    console.error("PDF Generation Error:", error);
    alert("Failed to generate PDF. Please try again.");
  }
};
