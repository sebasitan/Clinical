const { jsPDF } = require("jspdf");
const fs = require("fs");
const path = require("path");

// Read the markdown content
const manualPath = "c:\\Users\\Seba\\.gemini\\antigravity\\brain\\0228d22f-ea1e-46f7-98bf-0e1f29365087\\user_manual.md";
const outputPath = "c:\\Users\\Seba\\Desktop\\dental-clinic-web-app\\User_Manual.pdf";

try {
    const content = fs.readFileSync(manualPath, "utf-8");

    const doc = new jsPDF();

    // Simple text wrapping and pagination for jsPDF
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxLineWidth = pageWidth - margin * 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Dental Clinic Web App: User Manual", margin, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const lines = doc.splitTextToSize(content, maxLineWidth);
    let y = 30;

    lines.forEach((line) => {
        if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
        doc.text(line, margin, y);
        y += 7; // Line height
    });

    const pdfOutput = doc.output();
    fs.writeFileSync(outputPath, Buffer.from(pdfOutput, 'binary'));
    console.log("PDF generated successfully at: " + outputPath);
} catch (error) {
    console.error("Error generating PDF:", error);
    process.exit(1);
}
