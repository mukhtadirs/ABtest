import jsPDF from 'jspdf';
import type { DecisionResult } from './decision';
import type { Metric } from '../App';
import { formatP, formatPctSmart, formatCounts } from './format';

export async function generatePDFReport(result: DecisionResult, metric: Metric): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Colors (RGB values for jsPDF)
  const primaryBlue = [79, 70, 229] as const;
  const darkGray = [55, 65, 81] as const;
  const lightGray = [107, 114, 128] as const;
  const successGreen = [5, 150, 105] as const;
  const warningAmber = [217, 119, 6] as const;
  
  // Current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  let yPos = 25;
  
  // Header Section with ECCENTRIC logo
  pdf.setFontSize(20);
  pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ECCENTRIC', 20, yPos);
  
  pdf.setFontSize(10);
  pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  pdf.setFont('helvetica', 'normal');
  pdf.text(currentDate, pageWidth - 20, yPos, { align: 'right' });
  
  yPos += 15;
  
  // Main Title
  pdf.setFontSize(18);
  pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('A/B Test Results Summary', 20, yPos);
  
  yPos += 20;
  
  // Key Results Section
  const isSig = result.significant;
  const topName = result.winner ?? result.leader;
  const metricNoun = metric === 'ctr' ? 'CTR' : 'conversion rate';
  const isTie = !topName;
  
  // Results badge color
  const badgeColor = isSig ? successGreen : warningAmber;
  
  // Key finding box
  pdf.setFillColor(248, 250, 252); // Light background
  pdf.rect(20, yPos - 5, pageWidth - 40, 25, 'F');
  
  pdf.setFontSize(14);
  pdf.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  pdf.setFont('helvetica', 'bold');
  
  const headline = isTie 
    ? 'Equal Performance Detected' 
    : (isSig ? `Variant ${topName} is the Winner` : `Variant ${topName} is Leading`);
  
  pdf.text(headline, 25, yPos + 5);
  
  pdf.setFontSize(10);
  pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  pdf.setFont('helvetica', 'normal');
  
  if (!isTie) {
    const topVariant = result.variants.find(v => v.name === topName);
    const control = result.variants[0];
    if (topVariant) {
      const subheadline = `${formatPctSmart(topVariant.rate)} ${metricNoun}, vs ${formatPctSmart(control.rate)} for Control`;
      pdf.text(subheadline, 25, yPos + 12);
    }
  }
  
  yPos += 35;
  
  // Test Details
  pdf.setFontSize(12);
  pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Test Details', 20, yPos);
  
  yPos += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Statistical Test: ${result.testName}`, 25, yPos);
  yPos += 6;
  pdf.text(`P-Value: ${formatP(result.pValue)}`, 25, yPos);
  yPos += 6;
  pdf.text(`Significance Level: α = 0.05`, 25, yPos);
  yPos += 6;
  pdf.text(`Result: ${isSig ? 'Statistically Significant' : 'Not Statistically Significant'}`, 25, yPos);
  
  yPos += 20;
  
  // Variant Performance Table
  pdf.setFontSize(12);
  pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Variant Performance', 20, yPos);
  
  yPos += 15;
  
  // Table headers
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Variant', 25, yPos);
  pdf.text('Performance', 55, yPos);
  pdf.text('Count', 95, yPos);
  pdf.text('Confidence Interval', 125, yPos);
  
  yPos += 8;
  
  // Table rows
  const sortedVariants = [...result.variants].sort((a, b) => a.name.localeCompare(b.name));
  
  sortedVariants.forEach((variant) => {
    pdf.setFont('helvetica', 'normal');
    
    // Highlight winner/leader
    if (variant.name === topName && !isTie) {
      pdf.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
      pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    }
    
    pdf.text(variant.name, 25, yPos);
    pdf.text(formatPctSmart(variant.rate), 55, yPos);
    pdf.text(formatCounts(variant.successes, variant.traffic), 95, yPos);
    pdf.text(`${formatPctSmart(variant.ciLow)} - ${formatPctSmart(variant.ciHigh)}`, 125, yPos);
    
    yPos += 8;
  });
  
  yPos += 15;
  
  // Recommendations Section
  pdf.setFontSize(12);
  pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Recommendations', 20, yPos);
  
  yPos += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  let recommendation: string;
  if (isTie) {
    recommendation = 'Variants are performing equally. Consider running the test longer or try different variants.';
  } else if (isSig) {
    recommendation = `Implement Variant ${topName}. The results are statistically significant with p = ${formatP(result.pValue)}.`;
  } else {
    recommendation = `Continue testing. While Variant ${topName} is leading, more data is needed for statistical significance (p = ${formatP(result.pValue)}).`;
  }
  
  const lines = pdf.splitTextToSize(recommendation, pageWidth - 50);
  lines.forEach((line: string) => {
    pdf.text(line, 25, yPos);
    yPos += 6;
  });
  
  yPos += 15;
  
  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  pdf.text('Generated by A/B Test Advisor', 20, 280);
  pdf.text('https://a-btest.vercel.app', pageWidth - 20, 280, { align: 'right' });
  
  // Download the PDF
  const fileName = `AB_Test_Results_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}