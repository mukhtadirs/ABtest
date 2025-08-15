import jsPDF from 'jspdf';
import type { DecisionResult } from './decision';
import type { Metric } from '../App';
import { formatP, formatPctSmart, formatCounts } from './format';

export async function generatePDFReport(result: DecisionResult, metric: Metric): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Colors (RGB values for jsPDF)
  const primaryBlue = [79, 70, 229];
  const darkGray = [55, 65, 81];
  const lightGray = [107, 114, 128];
  const successGreen = [5, 150, 105];
  const warningAmber = [217, 119, 6];
  const lightBackground = [248, 250, 252];
  
  // Current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  let yPos = 25;
  
  // Header Section with ECCENTRIC logo
  pdf.setFontSize(20);
  pdf.setTextColor(...darkGray);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ECCENTRIC', 20, yPos);
  
  pdf.setFontSize(10);
  pdf.setTextColor(...lightGray);
  pdf.setFont('helvetica', 'normal');
  pdf.text(currentDate, pageWidth - 20, yPos, { align: 'right' });
  
  yPos += 15;
  
  // Main Title
  pdf.setFontSize(18);
  pdf.setTextColor(...primaryBlue);
  pdf.setFont('helvetica', 'bold');
  pdf.text('A/B Test Results Summary', 20, yPos);
  
  yPos += 20;
  
  // Key Results Section
  const isSig = result.significant;
  const topName = result.winner ?? result.leader;
  const isTie = !topName;
  const metricNoun = metric === "ctr" ? "CTR" : "conversion rate";
  
  // Winner/Leader announcement with background
  if (isSig) {
    pdf.setFillColor(240, 253, 244); // Light green
  } else if (isTie) {
    pdf.setFillColor(239, 246, 255); // Light blue
  } else {
    pdf.setFillColor(254, 243, 199); // Light amber
  }
  
  pdf.rect(20, yPos - 5, pageWidth - 40, 25, 'F');
  
  pdf.setFontSize(14);
  if (isSig) {
    pdf.setTextColor(...successGreen);
  } else if (isTie) {
    pdf.setTextColor(...primaryBlue);
  } else {
    pdf.setTextColor(...warningAmber);
  }
  pdf.setFont('helvetica', 'bold');
  
  if (isTie) {
    pdf.text('RESULT: Equal Performance Detected', 25, yPos + 5);
  } else {
    const status = isSig ? 'WINNER' : 'LEADING';
    pdf.text(`RESULT: ${status} - Variant ${topName}`, 25, yPos + 5);
  }
  
  // Performance details
  if (!isTie) {
    const topVariant = result.variants.find(v => v.name === topName);
    if (topVariant) {
      pdf.setFontSize(12);
      pdf.setTextColor(...darkGray);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Performance: ${formatPctSmart(topVariant.rate)} ${metricNoun}`, 25, yPos + 12);
    }
  }
  
  // Statistical significance
  pdf.setFontSize(10);
  pdf.setTextColor(...lightGray);
  const sigText = isSig ? `Significant (p = ${formatP(result.pValue)})` : `Not significant (p = ${formatP(result.pValue)})`;
  pdf.text(sigText, 25, yPos + 18);
  
  yPos += 35;
  
  // Results Table
  pdf.setFontSize(14);
  pdf.setTextColor(...darkGray);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Test Results', 20, yPos);
  
  yPos += 10;
  
  // Table headers with background
  pdf.setFillColor(...lightBackground);
  pdf.rect(20, yPos - 5, pageWidth - 40, 8, 'F');
  
  pdf.setFontSize(10);
  pdf.setTextColor(...lightGray);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Variant', 25, yPos);
  pdf.text('Performance', 70, yPos);
  pdf.text('Traffic', 120, yPos);
  pdf.text('Results', 160, yPos);
  
  yPos += 12;
  
  // Sort variants alphabetically
  const sortedVariants = result.variants.sort((a, b) => a.name.localeCompare(b.name));
  const controlName = result.variants[0]?.name ?? "A";
  
  sortedVariants.forEach((variant, index) => {
    const isControl = variant.name === controlName;
    const isTop = !isTie && variant.name === topName;
    
    // Highlight top performer
    if (isTop) {
      if (isSig) {
        pdf.setFillColor(240, 253, 244); // Light green
      } else {
        pdf.setFillColor(254, 249, 195); // Light amber
      }
      pdf.rect(20, yPos - 5, pageWidth - 40, 8, 'F');
    }
    
    pdf.setFontSize(10);
    pdf.setTextColor(...darkGray);
    pdf.setFont('helvetica', isTop ? 'bold' : 'normal');
    
    // Variant name
    const variantText = isControl ? `${variant.name} (control)` : variant.name;
    pdf.text(variantText, 25, yPos);
    
    // Performance
    pdf.text(formatPctSmart(variant.rate), 70, yPos);
    
    // Traffic
    pdf.text(variant.traffic.toString(), 120, yPos);
    
    // Results
    const resultsText = `${formatCounts(variant.successes, variant.traffic)} ${metric === "ctr" ? "clicks" : "conversions"}`;
    pdf.text(resultsText, 160, yPos);
    
    yPos += 8;
  });
  
  yPos += 15;
  
  // Statistical Details
  pdf.setFontSize(12);
  pdf.setTextColor(...darkGray);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Statistical Analysis', 20, yPos);
  
  yPos += 8;
  
  pdf.setFontSize(10);
  pdf.setTextColor(...lightGray);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Test Method: ${result.testName}`, 20, yPos);
  
  yPos += 6;
  pdf.text(`Confidence Level: 95% (alpha = 0.05)`, 20, yPos);
  
  yPos += 6;
  pdf.text(`P-Value: ${formatP(result.pValue)}`, 20, yPos);
  
  yPos += 15;
  
  // Recommendation Section
  if (isTie) {
    pdf.setFillColor(239, 246, 255); // Light blue
  } else if (isSig) {
    pdf.setFillColor(240, 253, 244); // Light green
  } else {
    pdf.setFillColor(254, 243, 199); // Light amber
  }
  pdf.rect(20, yPos - 5, pageWidth - 40, 25, 'F');
  
  pdf.setFontSize(12);
  pdf.setTextColor(...darkGray);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RECOMMENDATION', 25, yPos + 3);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  let recommendation = '';
  if (isTie) {
    recommendation = 'No clear winner detected. Consider other factors such as implementation cost and complexity, or continue collecting data to identify a statistically significant difference.';
  } else if (isSig) {
    recommendation = `Implement Variant ${topName} for all traffic. The results show a statistically significant improvement over the control variant.`;
  } else {
    recommendation = `Continue testing. Variant ${topName} shows promise but requires additional data to establish statistical significance before making a decision.`;
  }
  
  // Split long text into multiple lines
  const splitText = pdf.splitTextToSize(recommendation, pageWidth - 50);
  pdf.text(splitText, 25, yPos + 10);
  
  yPos += Math.max(20, splitText.length * 4 + 10);
  
  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(...lightGray);
  pdf.text(`Generated by A/B Test Advisor on ${currentDate}`, 20, pageHeight - 15);
  pdf.text('ECCENTRIC', pageWidth - 20, pageHeight - 15, { align: 'right' });
  
  // Save the PDF
  const fileName = `ab-test-results-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}