import jsPDF from 'jspdf';

interface CertificateData {
    certificate_number: string;
    student_name: string;
    certificate_type: string;
    title: string;
    description?: string;
    issue_date: string;
    issued_by_name: string;
}

export const generateCertificatePDF = (certificate: CertificateData) => {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Certificate Border
    doc.setLineWidth(3);
    doc.setDrawColor(41, 128, 185); // Primary blue color
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    doc.setLineWidth(1);
    doc.setDrawColor(41, 128, 185);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // School Name/Logo
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('EduBridge School Management System', pageWidth / 2, 35, { align: 'center' });

    // Certificate Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'normal');
    doc.text('CERTIFICATE', pageWidth / 2, 50, { align: 'center' });

    // Certificate Type
    doc.setFontSize(16);
    doc.setFont('helvetica', 'italic');
    doc.text(certificate.certificate_type, pageWidth / 2, 60, { align: 'center' });

    // Decorative line
    doc.setLineWidth(0.5);
    doc.line(60, 65, pageWidth - 60, 65);

    // "This is to certify that"
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('This is to certify that', pageWidth / 2, 80, { align: 'center' });

    // Student Name
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(certificate.student_name, pageWidth / 2, 95, { align: 'center' });

    // Underline for student name
    doc.setLineWidth(0.5);
    doc.line(80, 97, pageWidth - 80, 97);

    // Certificate Title/Achievement
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('has been awarded this certificate for', pageWidth / 2, 110, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(certificate.title, pageWidth - 80);
    doc.text(titleLines, pageWidth / 2, 120, { align: 'center' });

    let yPosition = 120 + (titleLines.length * 7);

    // Description (if exists)
    if (certificate.description) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        const descLines = doc.splitTextToSize(certificate.description, pageWidth - 80);
        doc.text(descLines, pageWidth / 2, yPosition + 5, { align: 'center' });
        yPosition += descLines.length * 5 + 10;
    }

    // Issue Date
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date of Issue: ${new Date(certificate.issue_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}`, pageWidth / 2, yPosition + 15, { align: 'center' });

    // Signature Section
    const signatureY = pageHeight - 45;

    // Left side - Issued By
    doc.setFontSize(10);
    doc.text('Issued By:', 40, signatureY);
    doc.setFont('helvetica', 'bold');
    doc.text(certificate.issued_by_name, 40, signatureY + 6);
    doc.setLineWidth(0.3);
    doc.line(35, signatureY + 8, 85, signatureY + 8);

    // Right side - Principal/Authority
    doc.setFont('helvetica', 'normal');
    doc.text('Principal', pageWidth - 60, signatureY);
    doc.setFont('helvetica', 'bold');
    doc.text('_________________', pageWidth - 70, signatureY + 6);

    // Certificate Number
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Certificate No: ${certificate.certificate_number}`, pageWidth / 2, pageHeight - 20, { align: 'center' });

    // Save the PDF
    doc.save(`Certificate_${certificate.certificate_number}.pdf`);
};
